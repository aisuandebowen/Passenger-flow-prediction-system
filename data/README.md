# data/ · 数据目录

所有模块的数据都外置到这个目录，与代码完全分离。每个 JSON 都可以直接编辑，页面即时生效（dev 模式热更新）。

## 文件清单

### metro-cities/ — 各城市线网数据

一座城市一个 JSON，详见 `metro-cities/README.md`（含怎么新增城市、怎么换右侧面板站名）。

- `beijing.json`：北京，真实地理模式（geo），26 条线路、406 站、104 个换乘站，真实经纬度 + 官方线路色
- `qingdao.json`：青岛，真实地理模式（geo），8 条线路、176 站、17 个换乘站，真实经纬度 + 官方线路色
- `geo/<城市>-districts.json`：城市行政区划边界 GeoJSON（DataV.GeoAtlas），作地图底图

站点真实性：站名、站序、站数逐线对照北京地铁官网/官方线网图与百科词条核验；
坐标来自 OpenStreetMap。切换城市 / 只显示部分线路：改 `src/config/map.ts`。

```jsonc
{
  "city": "北京",
  "cityId": "beijing",
  "mode": "geo",                        // 真实地理模式（经纬度 + 边界底图）
  "boundary": "./data/metro-cities/geo/beijing-districts.json",
  "center": [116.29, 40.05],            // 备用视野中心（组件按数据包围盒自动居中）
  "lines": [
    {
      "id": "M1",                       // 线路 id（配置里过滤线路用它）
      "name": "1号线八通线",             // 显示名
      "color": "#C33831",               // 官方线路色
      "loop": false,                    // 环线（如 2 号线/10 号线为 true）
      "stations": [                     // 途经站点（真实经纬度，按站序排列）
        { "name": "苹果园", "lng": 116.171628, "lat": 39.924597 }
      ]
    }
  ],
  "stations": [                          // 全局去重站点（画点/点击/改色用）
    { "name": "西单", "lng": 116.374, "lat": 39.906, "lines": ["M1", "M4"], "transfer": true }
  ],
  "od": {
    "hub":  { "name": "天安门西", "lng": 116.385, "lat": 39.906 },   // 光线发射枢纽
    "flows": [ { "name": "西直门", "lng": 116.349, "lat": 39.939, "value": 8500 } ]
  }
}
```

坐标是真实经纬度（WGS84），模块经 Web 墨卡托投影绘制；`od.flows[].value` 为演示数据。

### sidebar-menus.json — 侧边栏菜单

```jsonc
[
  {
    "id": "monitor", "title": "客流监测", "icon": "chart",   // icon: chart/network/alert
    "children": [
      { "id": "realtime", "title": "实时客流" },
      { "id": "history",  "title": "历史客流" },
      { "id": "forecast", "title": "客流预测" }
    ]
  }
  // 共 3 组 × 3 项；增删改任意一组/一项，侧边栏自动更新
]
```

### panel1-line-rank.json — 线路客运量排行（横向条形图）

```jsonc
{ "title": "线路客运量排行", "unit": "万人次",
  "data": [ { "name": "1号线", "value": 145 }, ... ] }   // 按value降序排，图表直接按数组顺序画
```

### panel2-transfer-radar.json — 换乘站客流压力（旧版，已由 transfer-pressure.json 取代）

旧版"多站同图"雷达数据，当前雷达面板已改用 `transfer-pressure.json`（见下方车站管理段）。文件保留仅作兼容。

### panel3-alarms.json — 实时告警（无缝滚动列表）

```jsonc
{ "title": "实时告警信息",
  "columns": [
    { "title": "站点", "dataIndex": "station", "width": "28%" },
    { "title": "类型", "dataIndex": "type",    "width": "30%" },
    { "title": "级别", "dataIndex": "level",   "width": "16%" },
    { "title": "时间", "dataIndex": "time",    "width": "26%", "align": "right" }
  ],
  "data": [
    { "station": "西单", "type": "大客流预警", "level": "紧急",
      "time": "08:30", "levelType": "danger" }   // levelType: danger(橙红) / warning(黄) / normal(蓝)
  ] }
```

`columns.dataIndex` 对应 `data` 里每行的字段名，可自由增删列。

### panel4-trend.json — 全网客流趋势（预留）

24 小时分时客流（进站/出站），预留给后续的趋势面板使用。

## 车站管理页（station-manage）数据

车站管理页的 4 个数据文件。`network` 与 `lines.*` 同构，后端可各自独立出接口；
线路筛选选中某线路时前端取 `lines[线路id]`，取不到自动回退 `network`。
线路 id 与 `metro-cities/<城市>.json` 的 `lines[].id` 一致（如 M1 / M10 / CP）。

### station-kpi.json — 车站运行总览 KPI（顶部横幅）

```jsonc
{ "title": "车站运行总览",
  "network": {                              // 全网口径；lines 里每条线路同构
    "name": "全网",                         // 选中线路时横幅左侧显示该名称
    "stations": 406,                        // 车站总数（座）
    "transferStations": 104,                // 换乘站数
    "inflow": 86.4, "inflowUnit": "万人次/h", "inflowDelta": 5.2,   // 实时进站量 + 环比昨日%
    "crowdTotal": 12, "crowdSevere": 3, "crowded": 9,               // 拥挤车站：总数/严重/一般
    "limitTotal": 5, "limitLevelA": 2, "limitLevelB": 3,            // 限流车站：总数/A级/B级
    "deviceOnlineRate": 99.2,               // 车站设备在线率（%）
    "gateOnline": 2846, "escalatorFaults": 3                        // 闸机在线台数 / 扶梯故障数
  },
  "lines": { "M1": { ...同 network... }, "M10": { ... } } }
```

### station-detail.json — 车站实时详情（联动地图/榜单选中站）

`stations` 的 key 是站名，需与地图数据（`metro-cities/*.json`）站名一致才能联动高亮。
点到的站不在本文件里时，前端会按线网数据（线路徽章/换乘标记）+ `station-load.json`
满载率自动推算一套演示指标（面板标注「推算指标」），保证任意车站点击都能联动展示；
接入后端后补全本文件的站即可用真实数据覆盖推算值。面板只随全局选中站切换，无独立切换控件。

```jsonc
{ "title": "车站实时详情", "defaultStation": "国贸",
  "stations": {
    "国贸": {
      "lines": [ { "id": "M1", "name": "1号线", "color": "#C33831" } ],  // 途经线路徽章（自包含，颜色随文件下发）
      "status": "crowd",                    // 拥挤状态: ok(舒适) / warn(一般) / crowd(拥挤)
      "metrics": {
        "inflow": 18246, "outflow": 16933,  // 进/出站量（人次，实时）
        "transfer": 9512,                   // 换乘量（非换乘站传 0，面板显示 "—"）
        "load": 128                         // 站台满载率（%）：>=90 黄 / >=120 红 / 其余绿
      },
      "hours": ["06:00", ..., "23:00"],     // 分时刻度（18 点，与曲线对齐）
      "hourly": {
        "in":  [3400, 6100, ...],           // 进站分时曲线，长度与 hours 一致
        "out": [3100, 5400, ...]
      },
      "firstTrain": "05:19", "lastTrain": "23:15",
      "notice": "A口 限流中"                // 限流/管控提示，null 则显示"无限流措施"
    }
  } }
```

### station-alerts.json — 拥挤·限流车站处置榜

按严重程度排序（前端按数组顺序渲染，一般后端按满载率降序下发）。

```jsonc
{ "title": "拥挤 · 限流车站", "updated": "08:30",
  "list": [
    { "station": "天通苑",                          // 站名（与地图站名一致可点击联动）
      "lines": [ { "id": "M5", "name": "5号线", "color": "#A4217F" } ],  // 途经线路色点
      "load": 132,                                  // 满载率（%），进度条 140% 封顶
      "level": "severe",                            // 级别: severe(严重拥挤/红) / crowded(拥挤/黄) / limit(限流/金)
      "status": "严重拥挤",                          // 状态文字（数据下发直接展示）
      "action": "加开临客 2 列" }                    // 处置措施
  ] }
```

### transfer-pressure.json — 换乘站客流压力（对比条形图，可切换换乘站）

每个换乘站 8 个压力维度，图表为「当前 vs 早高峰峰值」横向对比条形图：`axes` 是 8 个压力维度，
`stations` 的 key 为换乘站名（在地图上点选该站时雷达自动跟随切换）。

```jsonc
{ "title": "换乘站客流压力", "defaultStation": "西直门",
  "axes": ["进站量", "换乘量", "站台密度", "通道流", "安检排队", "扶梯负载", "票务压力", "出站量"],
  "max": 100,                               // 各维度归一上限
  "stations": {
    "西直门": { "current": [78, 92, ...], "peak": [95, 100, ...] }   // 长度与 axes 对齐
  } }
```

## 切换成 API

见 `src/config/data-source.ts` 的注释：把 `DATA_MODE` 改成 `"api"`，并在 `API_ENDPOINTS` 填上接口地址。
接口只需返回与上面对应 JSON **相同结构**的响应体即可。

## 数据约定

- 编码统一 UTF-8（站名含中文）
- 所有 JSON 已格式化，可直接编辑
- 地图坐标：任意平面坐标系（x 向右增、y 向下增），模块按包围盒自动等比缩放居中
