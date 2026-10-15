# 城市线网数据（data/metro-cities/）

中央地图模块（`src/modules/metro-map`）的数据目录。**一座城市一个 JSON 文件**，文件名就是城市 id，
另加该城市的行政区划边界 GeoJSON 作地图底图。

```
data/metro-cities/
├── beijing.json               # 北京（26 条线 / 406 站，真实经纬度）
├── qingdao.json               # 青岛（8 条线 / 176 站，真实经纬度）
├── geo/
│   ├── beijing-districts.json # 北京 16 区边界（DataV.GeoAtlas，含区县界）
│   └── qingdao-districts.json # 青岛 10 区边界（含真实海岸线）
└── README.md                  # 本文件
```

## 数据真实性（核验说明）

- **坐标**：全部来自 OpenStreetMap 的真实地理坐标（WGS84 经纬度），并做了"站点落在城市边界内"的程序化校验。
- **站名 / 站序 / 站数**：逐线路与权威来源交叉核验——
  - 北京：北京地铁官网（bjsubway.com）线路车站表逐站比对；官方《北京城市轨道交通线网图》（2026 年 6 月版）
    用于核对官方线路色与线路清单；3/12/14/16/17/燕房线等对照百科词条（暂缓开通/在建站已剔除，如 14 号线红庙站）。
  - 青岛：1/2/3/4/6/8/11(蓝谷快线)/13(西海岸快线) 全部 8 条线路与百科词条车站列表逐站一致。
  - 未开通线路不收录（如北京 18 号线以外的规划线、雄安 R1 线、青岛 5 号线在建段、蓝谷快线鳌山湾站暂缓开通等均未收录/剔除）。
- **线路色**：北京取自官方线网图图例色块的逐像素取样；青岛取自 OSM 收录的官方色。
- **OD 流量（od.flows）**：演示数据（随机值 2600–9000），接入真实数据时替换即可。

## 切换城市

地图右上角有「北京 / 青岛」切换按钮，运行时直接切换；
`src/config/map.ts` 的 `city` 决定**初始**城市：

```ts
export const mapConfig = {
  city: "beijing",          // 初始城市："beijing" | "qingdao"
  visibleLines: null,       // 只显示哪些线路 id；null = 全部
  od: { enabled: true },    // OD 流量光线开关
};
```

> 注意：右侧三个面板的数据在 `data/` 根目录（panel1~3），目前是北京的内容。
> 若长期展示青岛，请同步替换面板 JSON 里的线路/站名（见 `data/README.md`）。

## 自定义只显示哪几条线路

`visibleLines` 填线路 id 数组：

```ts
visibleLines: ["M1", "M2"],          // 北京只看 1号线八通线 / 2号线
visibleLines: ["Q1", "Q8"],          // 青岛只看 1号线 / 8号线
```

线路 id 在城市 JSON 每条线的 `id` 字段（北京 `M1`~`M19`、`CP`/`FS`/`YF`/`YZ`/`S1`/`CAE`/`DAE`；青岛 `Q1`~`Q13`）。

## 数据文件格式

```jsonc
{
  "city": "北京",
  "cityId": "beijing",
  "mode": "geo",                                  // 真实地理模式
  "boundary": "./data/metro-cities/geo/beijing-districts.json",  // 底图边界
  "center": [116.29, 40.05],                      // [lng, lat]（备用；组件按数据包围盒自动居中）

  "lines": [
    {
      "id": "M1",                                 // 线路 id（visibleLines 过滤用它）
      "name": "1号线八通线",                       // 显示名
      "color": "#C33831",                         // 官方线路色
      "loop": false,                              // true = 环线（首尾相接闭合绘制）
      "stations": [                               // 途经站点，按运营站序排列
        { "name": "苹果园", "lng": 116.171628, "lat": 39.924597 }
      ]
    }
  ],

  // 全局去重站点：画站点圆点、点击弹窗、改色都用它
  "stations": [
    { "name": "西单", "lng": 116.374286, "lat": 39.906052,
      "lines": ["M1", "M4"], "transfer": true }
  ],

  // OD 流量光线（演示数据）
  "od": {
    "hub":  { "name": "天安门西", "lng": 116.385162, "lat": 39.90597 },
    "flows": [ { "name": "西直门", "lng": 116.349235, "lat": 39.939217, "value": 8500 } ]
  }
}
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `lines[].stations` | 线路途经站点，按站序排列，绘制线路走向时依次连线；`loop: true` 时首尾闭合 |
| `stations[].lines` | 该站所属线路 id 列表，≥2 条即换乘站（金色大点） |
| `stations[].transfer` | 换乘站标记（与 `lines` 长度一致） |
| `od.flows[].value` | 流量大小（数字越大光线越粗越亮，演示数据 2600~9000） |
| `boundary` | 底图 GeoJSON 路径（相对站点根目录），FeatureCollection，Polygon/MultiPolygon 均可 |

坐标是**真实经纬度（WGS84）**。模块用 Web 墨卡托投影绘制，自动按数据包围盒适配缩放。

## 怎么新增一座城市

1. 准备数据（需要真实经纬度的站点与线路）：
   - 站点坐标可从 OpenStreetMap 取（推荐 Overpass API，`railway=station`+`station=subway`，
     线路用 `route=subway` 关系的 stop 成员顺序）；
   - 站名/站序与官方渠道（官网、官方线网图）核对一遍，未开通的车站不要收录。
2. 下载该城市行政区划边界：`https://geo.datav.aliyun.com/areas_v3/bound/<adcode>_full.json`，
   存为 `geo/<城市id>-districts.json`。
3. 新建 `data/metro-cities/<城市id>.json`，按上面格式填写。
4. `src/config/map.ts` 的 `CityId` 类型加上新 id，`CITIES` 数组（`MetroMap.tsx` 顶部）加切换按钮。
5. 完成，切换按钮会自动出现新城市。

## 右侧面板的站名/数据怎么换

右侧 3 个面板的数据**不在本目录**，在 `data/` 根目录，一个面板一个 JSON：

| 面板 | 数据文件 | 里面的站名 |
|---|---|---|
| panel1 线路客运量排行 | `data/panel1-line-rank.json` | `data` 数组每项的 `name`（线路名） |
| panel2 换乘站客流压力 | `data/panel2-transfer-radar.json` | `indicators` 数组每项的 `name`（换乘站名） |
| panel3 实时告警 | `data/panel3-alarms.json` | 告警记录里的站点名 |

**换站名 = 改 JSON 里的 `name`**，改完即时生效，不需要动代码。

## 用 API 提供这些数据

把 `src/config/data-source.ts` 的 `DATA_MODE` 改成 `"api"`，城市接口是：

```
GET /api/metro/city/<城市id>     → 返回本目录对应 JSON 的完整结构
```

`<城市id>` 即 `mapConfig.city`（运行时切换城市时是所选城市 id）。底图边界 JSON 由前端按 `boundary`
字段直接 fetch，API 模式下把它换成对应静态资源或接口地址即可。
