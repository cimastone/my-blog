import{_ as i,B as e,c as o,o as r,j as t,a as n,G as p,ae as d,w as l}from"./chunks/framework.DdsvLfqH.js";const j=JSON.parse('{"title":"Redisson分布式锁+本地缓存的典型流程","description":"","frontmatter":{},"headers":[],"relativePath":"guide/Redisson分布式锁+本地缓存.md","filePath":"guide/Redisson分布式锁+本地缓存.md"}'),u={name:"guide/Redisson分布式锁+本地缓存.md"},g={id:"12cc2516"},y={id:"66f3479e"},b={id:"44527895"},f={id:"369e8309"},m={id:"18807007"},k={id:"ee5f4a02"},T={id:"2d470ac5"},L={id:"9da7d200"};function M(v,s,C,w,S,R){const a=e("font");return r(),o("div",null,[s[71]||(s[71]=t("h1",{id:"redisson分布式锁-本地缓存的典型流程",tabindex:"-1"},[n("Redisson分布式锁+本地缓存的典型流程 "),t("a",{class:"header-anchor",href:"#redisson分布式锁-本地缓存的典型流程","aria-label":'Permalink to "Redisson分布式锁+本地缓存的典型流程"'},"​")],-1)),t("h2",g,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[0]||(s[0]=[n("Redisson分布式锁+本地缓存的典型流程")])),_:1,__:[0]})]),s[72]||(s[72]=n(" 1. **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[1]||(s[1]=[n("本地缓存优先")])),_:1,__:[1]}),s[73]||(s[73]=n("** - ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[2]||(s[2]=[n("线程先查本地缓存，命中直接返回，否则进入后续流程。")])),_:1,__:[2]}),s[74]||(s[74]=n(" 2. **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[3]||(s[3]=[n("获取分布式锁")])),_:1,__:[3]}),s[75]||(s[75]=n("** - ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[4]||(s[4]=[n("本地只有一个线程对Redisson分布式锁进行竞争，避免本地多线程穿透。")])),_:1,__:[4]}),s[76]||(s[76]=n(" 3. **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[5]||(s[5]=[n("锁内逻辑")])),_:1,__:[5]}),s[77]||(s[77]=n("** - ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[6]||(s[6]=[n("获取锁后，先查Redis（Redisson的Map缓存）。")])),_:1,__:[6]}),s[78]||(s[78]=n(" * ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[7]||(s[7]=[n("查到数据：写入本地缓存，唤醒本地挂起线程，释放锁。")])),_:1,__:[7]}),s[79]||(s[79]=n(" * ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[8]||(s[8]=[n("未查到数据：调用第三方，写入Redis（含失效时间），写入本地缓存，唤醒本地挂起线程，释放锁。")])),_:1,__:[8]}),p(a,{style:{color:"rgb(31, 35, 40)"}}),t("h2",y,[s[10]||(s[10]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[9]||(s[9]=[n("Redisson推荐用法")])),_:1,__:[9]}),s[11]||(s[11]=n("**"))]),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[12]||(s[12]=[n("Redisson本身支持")])),_:1,__:[12]}),s[80]||(s[80]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[13]||(s[13]=[n("本地缓存+分布式Map同步")])),_:1,__:[13]}),s[81]||(s[81]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[14]||(s[14]=[n("（如")])),_:1,__:[14]}),s[82]||(s[82]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[15]||(s[15]=[n("RLocalCachedMap")])),_:1,__:[15]}),s[83]||(s[83]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[16]||(s[16]=[n("），可以配置同步策略如下：")])),_:1,__:[16]}),t("ul",null,[t("li",null,[t("strong",null,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[17]||(s[17]=[n("同步策略（SyncStrategy）")])),_:1,__:[17]})]),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[18]||(s[18]=[n("：")])),_:1,__:[18]}),t("ul",null,[t("li",null,[t("strong",null,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[19]||(s[19]=[n("UPDATE")])),_:1,__:[19]})]),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[20]||(s[20]=[n("：远端数据更新时，通知本地缓存刷新/删除")])),_:1,__:[20]})]),t("li",null,[t("strong",null,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[21]||(s[21]=[n("INVALIDATE")])),_:1,__:[21]})]),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[22]||(s[22]=[n("：远端数据更新/删除时，通知所有本地缓存删除")])),_:1,__:[22]})]),t("li",null,[t("strong",null,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[23]||(s[23]=[n("NONE")])),_:1,__:[23]})]),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[24]||(s[24]=[n("：本地缓存只靠TTL，自行失效")])),_:1,__:[24]})])])])]),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[25]||(s[25]=[n("最佳实践是采用")])),_:1,__:[25]}),s[84]||(s[84]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[26]||(s[26]=[n("INVALIDATE策略")])),_:1,__:[26]}),s[85]||(s[85]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[27]||(s[27]=[n("+TTL，保证更新和删除时所有节点本地缓存都被同步清理。")])),_:1,__:[27]}),p(a,{style:{color:"rgb(31, 35, 40)"}}),t("h2",b,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[28]||(s[28]=[n("结论与建议")])),_:1,__:[28]})]),s[86]||(s[86]=n(" + **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[29]||(s[29]=[n("本地缓存失效")])),_:1,__:[29]}),s[87]||(s[87]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[30]||(s[30]=[n("建议采用Redisson的")])),_:1,__:[30]}),s[88]||(s[88]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[31]||(s[31]=[n("RLocalCachedMap")])),_:1,__:[31]}),s[89]||(s[89]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[32]||(s[32]=[n("，配置")])),_:1,__:[32]}),s[90]||(s[90]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[33]||(s[33]=[n("INVALIDATE")])),_:1,__:[33]}),s[91]||(s[91]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[34]||(s[34]=[n("同步策略和TTL。")])),_:1,__:[34]}),s[92]||(s[92]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[35]||(s[35]=[n("如只用本地Map，需同步维护TTL，且建议比Redis TTL略短一点，防止脏读。")])),_:1,__:[35]}),s[93]||(s[93]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[36]||(s[36]=[n("高一致性场景务必开启失效/删除消息同步（Redis keyspace event或Redisson自带机制）。")])),_:1,__:[36]}),s[94]||(s[94]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[37]||(s[37]=[n("如果对一致性要求极高，也可考虑写入数据后广播通知。")])),_:1,__:[37]}),p(a,{style:{color:"rgb(31, 35, 40)"}}),t("h2",f,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[38]||(s[38]=[n("Redisson/Redis的分布式“唤醒”机制")])),_:1,__:[38]})]),t("h3",m,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[39]||(s[39]=[n("1. 数据一致性传播")])),_:1,__:[39]})]),s[95]||(s[95]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[40]||(s[40]=[n("拿到分布式锁的节点写入RLocalCachedMap（底层操作是先写Redis，再同步/刷新本地缓存）。")])),_:1,__:[40]}),s[96]||(s[96]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[41]||(s[41]=[n("Redisson会通过")])),_:1,__:[41]}),s[97]||(s[97]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[42]||(s[42]=[n("本地缓存同步策略")])),_:1,__:[42]}),s[98]||(s[98]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[43]||(s[43]=[n("（如")])),_:1,__:[43]}),s[99]||(s[99]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[44]||(s[44]=[n("INVALIDATE")])),_:1,__:[44]}),s[100]||(s[100]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[45]||(s[45]=[n("）将本地缓存失效/刷新消息广播给所有集群节点。")])),_:1,__:[45]}),s[101]||(s[101]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[46]||(s[46]=[n("其它节点再次")])),_:1,__:[46]}),s[102]||(s[102]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[47]||(s[47]=[n("get(key)")])),_:1,__:[47]}),s[103]||(s[103]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[48]||(s[48]=[n("时，要么本地缓存已被刷新（读到新数据），要么本地缓存已失效（触发到Redis读取新数据）。")])),_:1,__:[48]}),t("h3",k,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[49]||(s[49]=[n("2. 本地等待线程如何感知？")])),_:1,__:[49]})]),s[104]||(s[104]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[50]||(s[50]=[n("集群中其它节点的请求，如果未拿到分布式锁，会挂起在本地，")])),_:1,__:[50]}),s[105]||(s[105]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[51]||(s[51]=[n("通常是有超时机制的等待")])),_:1,__:[51]}),s[106]||(s[106]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[52]||(s[52]=[n("。")])),_:1,__:[52]}),s[107]||(s[107]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[53]||(s[53]=[n("当本节点本地缓存被Redisson自动同步/刷新时，挂起的线程重新检查缓存，就会读取到数据，然后被唤醒（即本地")])),_:1,__:[53]}),s[108]||(s[108]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[54]||(s[54]=[n("wait/notify")])),_:1,__:[54]}),s[109]||(s[109]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[55]||(s[55]=[n("）。")])),_:1,__:[55]}),s[110]||(s[110]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[56]||(s[56]=[n("你可以在本地“等待”逻辑里加自旋/定时唤醒机制（比如")])),_:1,__:[56]}),s[111]||(s[111]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[57]||(s[57]=[n("wait(timeout)")])),_:1,__:[57]}),s[112]||(s[112]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[58]||(s[58]=[n("+")])),_:1,__:[58]}),s[113]||(s[113]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)","background-color":"rgba(129, 139, 152, 0.12)"}},{default:l(()=>s[59]||(s[59]=[n("notifyAll")])),_:1,__:[59]}),s[114]||(s[114]=n("`")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[60]||(s[60]=[n("），保证不会一直死等。")])),_:1,__:[60]}),t("h3",T,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[61]||(s[61]=[n("3. 不需要显式网络唤醒")])),_:1,__:[61]})]),s[115]||(s[115]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[62]||(s[62]=[n("分布式环境下，无需你手动“远程唤醒”其它服务器线程，只要通过RLocalCachedMap的数据同步，所有节点都能及时拿到新数据。")])),_:1,__:[62]}),s[116]||(s[116]=n(" + ")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[63]||(s[63]=[n("本地线程只需“定期醒来检查一下缓存”，发现数据可")])),_:1,__:[63]}),p(a,{style:{color:"rgb(31, 35, 40)"}}),t("h2",L,[p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[64]||(s[64]=[n("为什么本地等待线程要设置超时时间？")])),_:1,__:[64]})]),s[117]||(s[117]=n(" 1. **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[65]||(s[65]=[n("防止锁线程异常导致永久挂起")])),_:1,__:[65]}),s[118]||(s[118]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}}),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[66]||(s[66]=[n("如果拿到分布式锁的线程因为第三方服务超时、代码异常、JVM崩溃等原因无法正常释放锁或写入缓存，本地等待的线程如果没有超时机制，会一直死等，导致服务可用性下降、线程资源泄漏、甚至雪崩。")])),_:1,__:[66]}),s[119]||(s[119]=n(" 2. **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[67]||(s[67]=[n("避免分布式锁丢失或网络异常带来的“假死”")])),_:1,__:[67]}),s[120]||(s[120]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}}),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[68]||(s[68]=[n("分布式环境下，锁超时、节点宕机、Redisson/Redis网络异常等故障都可能导致“锁线程”未正常唤醒本地等待线程，只有设置超时，等待线程才能自我恢复，做降级处理或提示失败。")])),_:1,__:[68]}),s[121]||(s[121]=n(" 3. **")),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[69]||(s[69]=[n("保证系统整体健壮性和可扩展性")])),_:1,__:[69]}),s[122]||(s[122]=n("**")),p(a,{style:{color:"rgb(31, 35, 40)"}}),p(a,{style:{color:"rgb(31, 35, 40)"}},{default:l(()=>s[70]||(s[70]=[n("高并发场景下，超时机制可以让系统在极端情况下及时释放资源，避免线程池被打满，影响后续请求。")])),_:1,__:[70]}),p(a,{style:{color:"rgb(31, 35, 40)"}}),p(a,{style:{color:"rgb(31, 35, 40)"}}),s[123]||(s[123]=d(`<div class="language-plain vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>import org.redisson.api.LocalCachedMapOptions;</span></span>
<span class="line"><span>import org.redisson.api.RLocalCachedMap;</span></span>
<span class="line"><span>import org.redisson.api.RLock;</span></span>
<span class="line"><span>import org.redisson.api.RedissonClient;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import java.util.Map;</span></span>
<span class="line"><span>import java.util.concurrent.*;</span></span>
<span class="line"><span>import java.util.concurrent.atomic.AtomicBoolean;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>/**</span></span>
<span class="line"><span> * 分布式缓存防击穿、穿透防护的高并发实现</span></span>
<span class="line"><span> */</span></span>
<span class="line"><span>public class DistributedCachePenetrationGuard {</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    private final RedissonClient redissonClient;</span></span>
<span class="line"><span>    private final RLocalCachedMap&lt;String, String&gt; cacheMap;</span></span>
<span class="line"><span>    // 本地wait对象，确保同key所有线程共用</span></span>
<span class="line"><span>    private final ConcurrentHashMap&lt;String, WaitObject&gt; waitMap = new ConcurrentHashMap&lt;&gt;();</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 配置项（可外部注入）</span></span>
<span class="line"><span>    private final long localWaitTimeoutMs = 5000;      // 本地线程最大等待5秒</span></span>
<span class="line"><span>    private final long thirdPartyTimeoutMs = 3000;     // 主查线程查第三方最大3秒</span></span>
<span class="line"><span>    private final long distLockTimeoutMs = 4000;       // 分布式锁最大持有4秒</span></span>
<span class="line"><span>    private final long spinIntervalMs = 100;           // 自旋线程每次sleep间隔</span></span>
<span class="line"><span>    private final long spinTimeoutMs = 4500;           // 自旋线程最大等待4.5秒</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    public DistributedCachePenetrationGuard(RedissonClient redissonClient) {</span></span>
<span class="line"><span>        this.redissonClient = redissonClient;</span></span>
<span class="line"><span>        LocalCachedMapOptions&lt;String, String&gt; options = LocalCachedMapOptions.&lt;String, String&gt;defaults()</span></span>
<span class="line"><span>                .cacheSize(10000)</span></span>
<span class="line"><span>                .timeToLive(10, TimeUnit.MINUTES)</span></span>
<span class="line"><span>                .evictionPolicy(LocalCachedMapOptions.EvictionPolicy.LRU)</span></span>
<span class="line"><span>                .syncStrategy(LocalCachedMapOptions.SyncStrategy.INVALIDATE)</span></span>
<span class="line"><span>                .reconnectionStrategy(LocalCachedMapOptions.ReconnectionStrategy.CLEAR);</span></span>
<span class="line"><span>        this.cacheMap = redissonClient.getLocalCachedMap(&quot;my-cache&quot;, options);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    /**</span></span>
<span class="line"><span>     * 高并发分布式缓存防击穿模板</span></span>
<span class="line"><span>     *</span></span>
<span class="line"><span>     * @param key            缓存key</span></span>
<span class="line"><span>     * @param thirdPartyCall 查询第三方的回调</span></span>
<span class="line"><span>     * @return 结果</span></span>
<span class="line"><span>     * @throws Exception 超时、异常等</span></span>
<span class="line"><span>     */</span></span>
<span class="line"><span>    public String getWithPenetrationGuard(String key, Callable&lt;String&gt; thirdPartyCall) throws Exception {</span></span>
<span class="line"><span>        // 1. 本地缓存优先</span></span>
<span class="line"><span>        String value = cacheMap.get(key);</span></span>
<span class="line"><span>        if (value != null) return value;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        WaitObject waitObj = waitMap.computeIfAbsent(key, k -&gt; new WaitObject());</span></span>
<span class="line"><span>        boolean isLocalLeader = false;</span></span>
<span class="line"><span>        boolean isDistLockLeader = false;</span></span>
<span class="line"><span>        RLock distLock = redissonClient.getLock(&quot;dist-lock:&quot; + key);</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        try {</span></span>
<span class="line"><span>            // 2. 本地唯一线程尝试分布式锁，其它线程挂起</span></span>
<span class="line"><span>            synchronized (waitObj) {</span></span>
<span class="line"><span>                if (!waitObj.isProcessing.get()) {</span></span>
<span class="line"><span>                    waitObj.isProcessing.set(true);</span></span>
<span class="line"><span>                    isLocalLeader = true;</span></span>
<span class="line"><span>                } else {</span></span>
<span class="line"><span>                    // 本地其它线程挂起，细致超时处理</span></span>
<span class="line"><span>                    long startWait = System.currentTimeMillis();</span></span>
<span class="line"><span>                    long remain = localWaitTimeoutMs;</span></span>
<span class="line"><span>                    while (!waitObj.done.get() &amp;&amp; remain &gt; 0) {</span></span>
<span class="line"><span>                        waitObj.wait(remain);</span></span>
<span class="line"><span>                        if (waitObj.done.get()) break;</span></span>
<span class="line"><span>                        remain = localWaitTimeoutMs - (System.currentTimeMillis() - startWait);</span></span>
<span class="line"><span>                    }</span></span>
<span class="line"><span>                    // 被唤醒或超时后检查</span></span>
<span class="line"><span>                    value = cacheMap.get(key);</span></span>
<span class="line"><span>                    if (value != null) return value;</span></span>
<span class="line"><span>                    throw new TimeoutException(&quot;本地挂起超时，key=&quot; + key);</span></span>
<span class="line"><span>                }</span></span>
<span class="line"><span>            }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>            // 3. 本地唯一线程尝试获取分布式锁（细致超时）</span></span>
<span class="line"><span>            if (isLocalLeader) {</span></span>
<span class="line"><span>                try {</span></span>
<span class="line"><span>                    if (distLock.tryLock(distLockTimeoutMs, distLockTimeoutMs, TimeUnit.MILLISECONDS)) {</span></span>
<span class="line"><span>                        isDistLockLeader = true;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>                        // 拿到锁后再次检查缓存</span></span>
<span class="line"><span>                        value = cacheMap.get(key);</span></span>
<span class="line"><span>                        if (value == null) {</span></span>
<span class="line"><span>                            // 4. 主查线程查第三方（细致超时）</span></span>
<span class="line"><span>                            FutureTask&lt;String&gt; ft = new FutureTask&lt;&gt;(thirdPartyCall);</span></span>
<span class="line"><span>                            Thread t = new Thread(ft);</span></span>
<span class="line"><span>                            t.start();</span></span>
<span class="line"><span>                            try {</span></span>
<span class="line"><span>                                value = ft.get(thirdPartyTimeoutMs, TimeUnit.MILLISECONDS);</span></span>
<span class="line"><span>                                if (value != null) {</span></span>
<span class="line"><span>                                    cacheMap.put(key, value, 10, TimeUnit.MINUTES);</span></span>
<span class="line"><span>                                }</span></span>
<span class="line"><span>                            } catch (TimeoutException toe) {</span></span>
<span class="line"><span>                                ft.cancel(true);</span></span>
<span class="line"><span>                                throw new TimeoutException(&quot;第三方查询超时，key=&quot; + key);</span></span>
<span class="line"><span>                            }</span></span>
<span class="line"><span>                        }</span></span>
<span class="line"><span>                        // 唤醒本地所有等待线程</span></span>
<span class="line"><span>                        synchronized (waitObj) {</span></span>
<span class="line"><span>                            waitObj.done.set(true);</span></span>
<span class="line"><span>                            waitObj.notifyAll();</span></span>
<span class="line"><span>                        }</span></span>
<span class="line"><span>                    } else {</span></span>
<span class="line"><span>                        // 没拿到分布式锁，则作为“自旋线程”</span></span>
<span class="line"><span>                        value = spinForCache(key, waitObj);</span></span>
<span class="line"><span>                        if (value != null) return value;</span></span>
<span class="line"><span>                        throw new TimeoutException(&quot;分布式锁等待超时，自旋无果，key=&quot; + key);</span></span>
<span class="line"><span>                    }</span></span>
<span class="line"><span>                } finally {</span></span>
<span class="line"><span>                    if (isDistLockLeader &amp;&amp; distLock.isHeldByCurrentThread()) {</span></span>
<span class="line"><span>                        distLock.unlock();</span></span>
<span class="line"><span>                    }</span></span>
<span class="line"><span>                }</span></span>
<span class="line"><span>            }</span></span>
<span class="line"><span>            return cacheMap.get(key);</span></span>
<span class="line"><span>        } finally {</span></span>
<span class="line"><span>            // 故障自愈：无论成功失败都清理waitMap，防泄漏</span></span>
<span class="line"><span>            if (isLocalLeader) {</span></span>
<span class="line"><span>                waitMap.remove(key);</span></span>
<span class="line"><span>            }</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    /**</span></span>
<span class="line"><span>     * 自旋线程，不断尝试读缓存，期间其它本地线程都挂起</span></span>
<span class="line"><span>     */</span></span>
<span class="line"><span>    private String spinForCache(String key, WaitObject waitObj) throws InterruptedException {</span></span>
<span class="line"><span>        long start = System.currentTimeMillis();</span></span>
<span class="line"><span>        long remain = spinTimeoutMs;</span></span>
<span class="line"><span>        String value;</span></span>
<span class="line"><span>        while (remain &gt; 0) {</span></span>
<span class="line"><span>            value = cacheMap.get(key);</span></span>
<span class="line"><span>            if (value != null) {</span></span>
<span class="line"><span>                synchronized (waitObj) {</span></span>
<span class="line"><span>                    waitObj.done.set(true);</span></span>
<span class="line"><span>                    waitObj.notifyAll();</span></span>
<span class="line"><span>                }</span></span>
<span class="line"><span>                return value;</span></span>
<span class="line"><span>            }</span></span>
<span class="line"><span>            Thread.sleep(spinIntervalMs);</span></span>
<span class="line"><span>            remain = spinTimeoutMs - (System.currentTimeMillis() - start);</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        return null;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    /**</span></span>
<span class="line"><span>     * 本地线程wait/notify控制对象</span></span>
<span class="line"><span>     */</span></span>
<span class="line"><span>    static class WaitObject {</span></span>
<span class="line"><span>        // 是否已有主查线程处理</span></span>
<span class="line"><span>        final AtomicBoolean isProcessing = new AtomicBoolean(false);</span></span>
<span class="line"><span>        // 是否已结束</span></span>
<span class="line"><span>        final AtomicBoolean done = new AtomicBoolean(false);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre></div><div class="language-plain vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>// 初始化RedissonClient略...</span></span>
<span class="line"><span>DistributedCachePenetrationGuard guard = new DistributedCachePenetrationGuard(redissonClient);</span></span>
<span class="line"><span></span></span>
<span class="line"><span>String key = &quot;user:123&quot;;</span></span>
<span class="line"><span>try {</span></span>
<span class="line"><span>    String result = guard.getWithPenetrationGuard(</span></span>
<span class="line"><span>        key,</span></span>
<span class="line"><span>        () -&gt; {</span></span>
<span class="line"><span>            // 模拟第三方调用</span></span>
<span class="line"><span>            Thread.sleep(1200);</span></span>
<span class="line"><span>            return &quot;thirdparty_data&quot;;</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>    );</span></span>
<span class="line"><span>    System.out.println(&quot;Got result: &quot; + result);</span></span>
<span class="line"><span>} catch (TimeoutException toe) {</span></span>
<span class="line"><span>    // 超时降级或报警</span></span>
<span class="line"><span>    System.out.println(&quot;Timeout: &quot; + toe.getMessage());</span></span>
<span class="line"><span>} catch (Exception e) {</span></span>
<span class="line"><span>    // 其它异常</span></span>
<span class="line"><span>    e.printStackTrace();</span></span>
<span class="line"><span>}</span></span></code></pre></div>`,2))])}const A=i(u,[["render",M]]);export{j as __pageData,A as default};
