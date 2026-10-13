# 城市线网数据（data/metro-cities/）

中央地图模块（`src/modules/metro-map`）的数据目录。**一座城市一个 JSON 文件**，文件名就是城市 id。

```
data/metro-cities/
├── beijing.json        # 北京（矢量模式：线路折线 + 站点坐标，真实线网数据）
├── qingdao.json        # 青岛（图片模式：直接贴官方线网图作背景）
├── qingdao-map.jpg     # 青岛线网图本体（图片模式引用）
└── README.md           # 本文件
```

## 切换城市

改 `src/config/map.ts`：

```ts
export const mapConfig = {
  city: "qingdao",          // ← 改成 data/metro-cities/ 下的文件名（不含 .json）
  visibleLines: null,       // 只显示哪些线路；null = 全部
  od: { enabled: true, hub: "五四广场" },
};
```

保存即生效（dev 热更新），不需要改任何模块代码。

## 自定义只显示哪几条线路

`visibleLines` 填线路 id 数组：

```ts
visibleLines: ["M1", "M2", "M10"],   // 只画 1号线 / 2号线 / 10号线
```

线路 id 在城市 JSON 每条线的 `id` 字段（北京是 `M1`~`M27`、`CAE`、`DAE` 等）。

## 数据文件格式

```jsonc
{
  "city": "北京",              // 城市显示名
  "mode": "vector",           // "vector" 矢量模式 | "image" 图片模式

  // —— 以下只有 vector 模式需要 ——
  "lines": [
    {
      "id": "M1",             // 线路 id（visibleLines 过滤用它）
      "name": "1号线",        // 显示名
      "color": "#c23a30",     // 线路色
      "path": [[100, 200], [100, 300], [200, 300]],  // 线路折线点序列 [x, y]
      "stations": [           // 该线路途经的站点（换乘站会在多条线里重复出现，没关系）
        { "name": "苹果园", "x": 100, "y": 200, "transfer": false, "label": true }
      ]
    }
  ],

  // —— 以下只有 image 模式需要 ——
  "image": "./data/metro-cities/qingdao-map.jpg",   // 线网图文件（相对站点根目录）
  "imgWidth": 2200,           // 图片像素宽
  "imgHeight": 1307,          // 图片像素高

  // —— 两种模式都要 ——
  "od": {
    "hub":  { "name": "天安门西", "x": 824, "y": 727 },   // 枢纽（光线发射点）
    "flows": [                                             // 流量光线终点
      { "name": "西单", "x": 765, "y": 727, "value": 9000 }
    ]
  }
}
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `path` | 线路的折线点序列，相邻点连成直线。拐弯多就多点，直线就两个点 |
| `stations.transfer` | true = 换乘站（画大金点） |
| `stations.label` | true = 显示站名（小字），不然只画一个点 |
| `od.flows[].value` | 流量大小（数字越大线越粗越亮，范围看数据，北京用 2600~9000） |

坐标是**任意平面坐标系**，不需要经纬度：x 向右增、y 向下增。模块会自动算所有点的包围盒，等比缩放居中到地图区。北京用的坐标取自真实线网图，青岛用的是图片像素坐标。

## 怎么新增一座城市

### 情况 A：有矢量数据（线路+站点坐标）

1. 新建 `data/metro-cities/<城市id>.json`，`mode` 填 `"vector"`，按上面格式写线路。
   - 站点坐标从公开线网图上量即可，只要相对位置对，模块会自动缩放。
2. `src/config/map.ts` 的 `city` 改成 `<城市id>`，`od.hub` 改成该城市的枢纽站名。
3. 完成。`src/config/map.ts` 顶部的 `CityId` 类型加上新 id 会有类型提示（可选）。

### 情况 B：只有一张线网图（最快）

1. 把图（jpg/png 都行）放进 `data/metro-cities/`，比如 `shanghai-map.jpg`。
2. 新建 `data/metro-cities/shanghai.json`：

   ```json
   {
     "city": "上海",
     "mode": "image",
     "image": "./data/metro-cities/shanghai-map.jpg",
     "imgWidth": 2200,
     "imgHeight": 1300,
     "lines": [],
     "od": { "hub": { "name": "人民广场", "x": 1100, "y": 650 }, "flows": [] }
   }
   ```

   - `imgWidth/imgHeight` 填图片实际像素（在图上量，或用 `python3 -c "from PIL import Image; print(Image.open('shanghai-map.jpg').size)"`）。
   - `od.hub` 的 x/y 是**图片像素坐标**：原点在图片左上角。想换枢纽位置就改这两个数。
   - `flows` 留空就只有枢纽脉冲点；想要光线，按 `{"name":"任意站名","x":图片x,"y":图片y,"value":6000}` 加，x/y 同样是图片像素坐标。
3. `src/config/map.ts` 的 `city` 改成 `shanghai`。

> 图片模式不会画站点和站名（矢量信息都在图里了），OD 光线用你在 JSON 里填的像素坐标。

### 数据来源建议

- **矢量数据**：各城市地铁官方线网图、开源的 GTFS 数据、或高德/百度地图截图上量坐标。
- 北京这份数据是从公开线网图提取的：30 条线路、447 个站点、104 个换乘站，线路色用官方配色。

## 右侧面板的站名/数据怎么换

右侧 3 个面板的数据**不在本目录**，在 `data/` 根目录，一个面板一个 JSON：

| 面板 | 数据文件 | 里面的站名 |
|---|---|---|
 panel1 线路客运量排行 | `data/panel1-line-rank.json` | `data` 数组每项的 `name`（线路名） |
| panel2 换乘站客流压力 | `data/panel2-transfer-radar.json` | `indicators` 数组每项的 `name`（换乘站名） |
| panel3 实时告警 | `data/panel3-alarms.json` | 告警记录里的站点名 |

**换站名 = 改 JSON 里的 `name`**，改完即时生效，不需要动代码。

例：panel1 换成别的线路：

```jsonc
// data/panel1-line-rank.json
{
  "title": "线路客运量排行",
  "unit": "万人次",
  "data": [
    { "name": "10号线", "value": 182 },   // ← 改 name 就是改显示的线路名
    { "name": "1号线",  "value": 166 },
    ...
  ]
}
```

panel2 换成别的换乘站：

```jsonc
// data/panel2-transfer-radar.json
{
  "title": "换乘站客流压力",
  "indicators": [
    { "name": "西直门", "max": 100 },    // ← 改 name 就是改显示的站名
    { "name": "国贸",   "max": 100 },
    ...
  ],
  "current": [72, 85, ...],              // 顺序对齐 indicators
  "peak":   [95, 92, ...]
}
```

panel3 告警里的站点名同理，在 `data/panel3-alarms.json` 的每条记录里。

> 面板的详细结构看 `data/README.md` 和 `src/modules/panels/README.md`。
> 换城市时记得**也要把这些面板数据换成新城市的**，不然地图是青岛、排行还是北京的线路。

## 用 API 提供这些数据

把 `src/config/data-source.ts` 的 `DATA_MODE` 改成 `"api"`，城市接口是：

```
GET /api/metro/city/<城市id>     → 返回本目录对应 JSON 的完整结构
```

`<城市id>` 就是 `mapConfig.city`。其余面板接口见 `data-source.ts` 的 `API_ENDPOINTS`。
