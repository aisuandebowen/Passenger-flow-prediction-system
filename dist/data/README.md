# data/ · 数据目录

所有模块的数据都外置到这个目录，与代码完全分离。每个 JSON 都可以直接编辑，页面即时生效（dev 模式热更新）。

## 文件清单

### metro-lines.json — 北京地铁线网

```jsonc
{
  "lines": [
    {
      "id": "1",              // 线路唯一 id
      "name": "1号线",        // 显示名
      "color": "#C23A30",     // 线路色（画线用，可改成任意 hex）
      "stations": [
        { "name": "苹果园", "lng": 116.182, "lat": 39.925 }  // 站点：站名 + 经纬度
        // ...按运行顺序排列
      ]
    }
  ]
}
```

- 共 19 条线路（1-16、八通、昌平、房山、亦庄、机场、西郊）、340 个站点
- 同名站点出现在多条线路中即为换乘站（地图模块自动识别并高亮）
- **坐标为示意性近似值**，如需精确数据：替换 `stations` 里的 lng/lat 即可，结构不用动

### od-flows.json — OD 流量光线

```jsonc
{
  "hub": { "name": "天安门西", "lng": 116.398, "lat": 39.908 },  // 发射枢纽
  "flows": [
    { "name": "西直门", "lng": 116.355, "lat": 39.941, "line": "2号线", "value": 8500 }
    // value 越大，光线越粗越亮（value 范围约 800-10000）
  ]
}
```

每条 flow 会画一条从枢纽到该站的弧形流光光线 + 沿线移动的光点。

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

### panel2-transfer-radar.json — 换乘站客流压力（雷达图）

```jsonc
{ "title": "换乘站客流压力",
  "indicators": [ { "name": "西直门", "max": 100 }, ... ],   // 雷达轴（站名+最大值）
  "current": [ 86, 92, ... ],   // 当前值，顺序与 indicators 对齐
  "peak":    [ 95, 98, ... ] }  // 早高峰峰值
```

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

## 切换成 API

见 `src/config/data-source.ts` 的注释：把 `DATA_MODE` 改成 `"api"`，并在 `API_ENDPOINTS` 填上接口地址。
接口只需返回与上面对应 JSON **相同结构**的响应体即可。

## 数据约定

- 编码统一 UTF-8（站名含中文）
- 所有 JSON 已格式化，可直接编辑
- 坐标系：WGS84 经纬度（地图模块内部线性投影 + 纬度 cos 修正）
