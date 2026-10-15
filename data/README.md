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
- 地图坐标：任意平面坐标系（x 向右增、y 向下增），模块按包围盒自动等比缩放居中
