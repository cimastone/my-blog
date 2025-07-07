---
title: "Redisson分布式锁+本地缓存的典型流程"
date: 2025-07-07
author: cimaStone
tags: [Redisson分布式锁+本地缓存的典型流程]
category: "技术架构/分布式缓存"
---
# Redisson分布式锁+本地缓存的典型流程

## 🎯 背景与目标
基于上篇文章【高并发查询场景下基于Zookeeper+Redis的分布式一致性缓存设计方案】，使用另一种解决方案降低风险，采取的是redisson分布式锁和本地缓存+分布式Map同步（如 `RLocalCachedMap`）解决本地缓存与redis缓存同步的方式，不需要手动控制redis数据与本地缓存，减少了组件同时简化了设计，使得服务更加稳健

## 🔧 核心流程与控制点

1. **本地缓存优先**
   - 线程先查本地缓存，命中直接返回，否则进入后续流程。

2. **获取分布式锁**
   - 本地只有一个线程对Redisson分布式锁进行竞争，避免本地多线程穿透。

3. **锁内逻辑**
   - 获取锁后，先查Redis（Redisson的Map缓存）。
     * 查到数据：写入本地缓存，唤醒本地挂起线程，释放锁。
     * 未查到数据：调用第三方，写入Redis（含失效时间），写入本地缓存，唤醒本地挂起线程，释放锁。

## Redisson推荐用法

Redisson本身支持 **本地缓存+分布式Map同步**（如 `RLocalCachedMap`），可以配置同步策略如下：

+ **同步策略（SyncStrategy）**：
  - **UPDATE**：远端数据更新时，通知本地缓存刷新/删除
  - **INVALIDATE**：远端数据更新/删除时，通知所有本地缓存删除
  - **NONE**：本地缓存只靠TTL，自行失效

最佳实践是采用 **INVALIDATE策略** +TTL，保证更新和删除时所有节点本地缓存都被同步清理。

## 结论与建议

+ **本地缓存失效** 建议采用Redisson的 `RLocalCachedMap`，配置 `INVALIDATE` 同步策略和TTL。
+ 如只用本地Map，需同步维护TTL，且建议比Redis TTL略短一点，防止脏读。
+ 高一致性场景务必开启失效/删除消息同步（Redis keyspace event或Redisson自带机制）。
+ 如果对一致性要求极高，也可考虑写入数据后广播通知。

## Redisson/Redis的分布式"唤醒"机制

### 1. 数据一致性传播

+ 拿到分布式锁的节点写入RLocalCachedMap（底层操作是先写Redis，再同步/刷新本地缓存）。
+ Redisson会通过 **本地缓存同步策略**（如 `INVALIDATE`）将本地缓存失效/刷新消息广播给所有集群节点。
+ 其它节点再次 `get(key)` 时，要么本地缓存已被刷新（读到新数据），要么本地缓存已失效（触发到Redis读取新数据）。

### 2. 本地等待线程如何感知？

+ 集群中其它节点的请求，如果未拿到分布式锁，会挂起在本地，**通常是有超时机制的等待**。
+ 当本节点本地缓存被Redisson自动同步/刷新时，挂起的线程重新检查缓存，就会读取到数据，然后被唤醒（即本地 `wait/notify`）。
+ 你可以在本地"等待"逻辑里加自旋/定时唤醒机制（比如 `wait(timeout)` + `notifyAll`），保证不会一直死等。

### 3. 不需要显式网络唤醒

+ 分布式环境下，无需你手动"远程唤醒"其它服务器线程，只要通过RLocalCachedMap的数据同步，所有节点都能及时拿到新数据。
+ 本地线程只需"定期醒来检查一下缓存"，发现数据可用即可返回。

## 为什么本地等待线程要设置超时时间？

1. **防止锁线程异常导致永久挂起**  
   如果拿到分布式锁的线程因为第三方服务超时、代码异常、JVM崩溃等原因无法正常释放锁或写入缓存，本地等待的线程如果没有超时机制，会一直死等，导致服务可用性下降、线程资源泄漏、甚至雪崩。

2. **避免分布式锁丢失或网络异常带来的"假死"**  
   分布式环境下，锁超时、节点宕机、Redisson/Redis网络异常等故障都可能导致"锁线程"未正常唤醒本地等待线程，只有设置超时，等待线程才能自我恢复，做降级处理或提示失败。

3. **保证系统整体健壮性和可扩展性**  
   高并发场景下，超时机制可以让系统在极端情况下及时释放资源，避免线程池被打满，影响后续请求。

## 代码示例

```java
import org.redisson.api.LocalCachedMapOptions;
import org.redisson.api.RLocalCachedMap;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 分布式缓存防击穿、穿透防护的高并发实现
 */
public class DistributedCachePenetrationGuard {

    private final RedissonClient redissonClient;
    private final RLocalCachedMap<String, String> cacheMap;
    // 本地wait对象，确保同key所有线程共用
    private final ConcurrentHashMap<String, WaitObject> waitMap = new ConcurrentHashMap<>();

    // 配置项（可外部注入）
    private final long localWaitTimeoutMs = 5000;      // 本地线程最大等待5秒
    private final long thirdPartyTimeoutMs = 3000;     // 主查线程查第三方最大3秒
    private final long distLockTimeoutMs = 4000;       // 分布式锁最大持有4秒
    private final long spinIntervalMs = 100;           // 自旋线程每次sleep间隔
    private final long spinTimeoutMs = 4500;           // 自旋线程最大等待4.5秒

    public DistributedCachePenetrationGuard(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
        LocalCachedMapOptions<String, String> options = LocalCachedMapOptions.<String, String>defaults()
                .cacheSize(10000)
                .timeToLive(10, TimeUnit.MINUTES)
                .evictionPolicy(LocalCachedMapOptions.EvictionPolicy.LRU)
                .syncStrategy(LocalCachedMapOptions.SyncStrategy.INVALIDATE)
                .reconnectionStrategy(LocalCachedMapOptions.ReconnectionStrategy.CLEAR);
        this.cacheMap = redissonClient.getLocalCachedMap("my-cache", options);
    }

    /**
     * 高并发分布式缓存防击穿模板
     *
     * @param key            缓存key
     * @param thirdPartyCall 查询第三方的回调
     * @return 结果
     * @throws Exception 超时、异常等
     */
    public String getWithPenetrationGuard(String key, Callable<String> thirdPartyCall) throws Exception {
        // 1. 本地缓存优先
        String value = cacheMap.get(key);
        if (value != null) return value;

        WaitObject waitObj = waitMap.computeIfAbsent(key, k -> new WaitObject());
        boolean isLocalLeader = false;
        boolean isDistLockLeader = false;
        RLock distLock = redissonClient.getLock("dist-lock:" + key);

        try {
            // 2. 本地唯一线程尝试分布式锁，其它线程挂起
            synchronized (waitObj) {
                if (!waitObj.isProcessing.get()) {
                    waitObj.isProcessing.set(true);
                    isLocalLeader = true;
                } else {
                    // 本地其它线程挂起，细致超时处理
                    long startWait = System.currentTimeMillis();
                    long remain = localWaitTimeoutMs;
                    while (!waitObj.done.get() && remain > 0) {
                        waitObj.wait(remain);
                        if (waitObj.done.get()) break;
                        remain = localWaitTimeoutMs - (System.currentTimeMillis() - startWait);
                    }
                    // 被唤醒或超时后检查
                    value = cacheMap.get(key);
                    if (value != null) return value;
                    throw new TimeoutException("本地挂起超时，key=" + key);
                }
            }

            // 3. 本地唯一线程尝试获取分布式锁（细致超时）
            if (isLocalLeader) {
                try {
                    if (distLock.tryLock(distLockTimeoutMs, distLockTimeoutMs, TimeUnit.MILLISECONDS)) {
                        isDistLockLeader = true;

                        // 拿到锁后再次检查缓存
                        value = cacheMap.get(key);
                        if (value == null) {
                            // 4. 主查线程查第三方（细致超时）
                            FutureTask<String> ft = new FutureTask<>(thirdPartyCall);
                            Thread t = new Thread(ft);
                            t.start();
                            try {
                                value = ft.get(thirdPartyTimeoutMs, TimeUnit.MILLISECONDS);
                                if (value != null) {
                                    cacheMap.put(key, value, 10, TimeUnit.MINUTES);
                                }
                            } catch (TimeoutException toe) {
                                ft.cancel(true);
                                throw new TimeoutException("第三方查询超时，key=" + key);
                            }
                        }
                        // 唤醒本地所有等待线程
                        synchronized (waitObj) {
                            waitObj.done.set(true);
                            waitObj.notifyAll();
                        }
                    } else {
                        // 没拿到分布式锁，则作为"自旋线程"
                        value = spinForCache(key, waitObj);
                        if (value != null) return value;
                        throw new TimeoutException("分布式锁等待超时，自旋无果，key=" + key);
                    }
                } finally {
                    if (isDistLockLeader && distLock.isHeldByCurrentThread()) {
                        distLock.unlock();
                    }
                }
            }
            return cacheMap.get(key);
        } finally {
            // 故障自愈：无论成功失败都清理waitMap，防泄漏
            if (isLocalLeader) {
                waitMap.remove(key);
            }
        }
    }

    /**
     * 自旋线程，不断尝试读缓存，期间其它本地线程都挂起
     */
    private String spinForCache(String key, WaitObject waitObj) throws InterruptedException {
        long start = System.currentTimeMillis();
        long remain = spinTimeoutMs;
        String value;
        while (remain > 0) {
            value = cacheMap.get(key);
            if (value != null) {
                synchronized (waitObj) {
                    waitObj.done.set(true);
                    waitObj.notifyAll();
                }
                return value;
            }
            Thread.sleep(spinIntervalMs);
            remain = spinTimeoutMs - (System.currentTimeMillis() - start);
        }
        return null;
    }

    /**
     * 本地线程wait/notify控制对象
     */
    static class WaitObject {
        // 是否已有主查线程处理
        final AtomicBoolean isProcessing = new AtomicBoolean(false);
        // 是否已结束
        final AtomicBoolean done = new AtomicBoolean(false);
    }
}
```

## 使用示例
```java
// 初始化RedissonClient略...
DistributedCachePenetrationGuard guard = new DistributedCachePenetrationGuard(redissonClient);

String key = "user:123";
try {
    String result = guard.getWithPenetrationGuard(
        key,
        () -> {
            // 模拟第三方调用
            Thread.sleep(1200);
            return "thirdparty_data";
        }
    );
    System.out.println("Got result: " + result);
} catch (TimeoutException toe) {
    // 超时降级或报警
    System.out.println("Timeout: " + toe.getMessage());
} catch (Exception e) {
    // 其它异常
    e.printStackTrace();
}
```
