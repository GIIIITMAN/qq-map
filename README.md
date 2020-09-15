# 腾讯地图组件 qq-map

## 主要功能

1. 对腾讯地图 Javascript API 进行封装
2. 将地图对象的编程接口以配置方式实现
3. 可绑定地址变量，动态显示地图
3. 任意用户自定义信息窗显示格式
4. 灵活高效的 JSON 数据结构解析
5. 组件外部可通过可编程 API 得到地图对象，参考官方文档即可完成更多自定义功能
6. 可显示当前路况信息图层


## 可用变量
### KEYWORD
- 【类型】字符串 string
- 【说明】搜索的关键字
- 【示例】上海

### RESULT
- 【类型】搜索结果 array
- 【说明】搜索完成返回的结果
- 【示例】[{"latLng":{"lat":31.23037,"lng":121.4737},"name":"上海市","type":4}]

### LATITUDE
- 【类型】数字 number
- 【说明】地图上点击位置的纬度
- 【示例】39.9

### LONGITUDE
- 【类型】数字 number
- 【说明】地图上点击位置的经度
- 【示例】116.4

### POINT
- 【类型】对象 object
- 【说明】marker 可用，标记点对象
- 【示例】{"lat":39.916527,"lng":116.397128,"html":"<a href=\"#\">连接</a>"}


## 可用事件
### 搜索完成
- 【事件 ID】onSearchDone
- 【触发时机】搜索结果返回触发

### 点击标记
- 【事件 ID】onMarkerClick
- 【触发时机】点击标记触发

### 点击地图
- 【事件 ID】onClick
- 【触发时机】点击地图触发

### 地图库已加载
- 【事件 ID】onLibReady
- 【触发时机】初始化组件时地图库异步加载完成触发

### 右键菜单
- 【事件 ID】onShowMenu
- 【触发时机】打开右键菜单时触发

### 自定义菜单事件
- 【事件 ID】contextMenu-x (x = 0, 1, 2...)
- 【触发时机】点击右键菜单选项触发


## 编程API
### getMap
- 【说明】获取当前窗口地图对象
- 【参数】-
- 【返回值】地图对象，若不成功则返回空对象 {}，而不是 null
- 【示例】var map = Enhancer.getEntityByNumber(11).getWidget().getMap();

## 其他注意事项
- 本组件默认需要配置数据源，如不需要，在数据源里配置空 JSON 对象即可
  ```json
  {}
  ```
- 强烈建议设置中心点经纬度，组件提供自动获取位置功能，但易出现误差较大，网络不稳定等问题，不推荐使用。
- 自定义样式保存后，仍需要点击配置窗口下方的保存按钮保存全部组件配置
- 请参考[腾讯位置服务文档](https://lbs.qq.com/webApi/javascriptV2/jsGuide/jsBasic)申请 Key，并填入组件配置，加载地图库依赖此 Key
- 数据库数据返回格式说明
    - type: 必需，可取如下值
      - marker: 标注表示地图上的点
      - label: 文字标签，可以设置简单的样式
      - circle: 圆形覆盖物
      - polyline: 折线覆盖物
      - poligon: 折线覆盖物参数
    - points: 必需，数组，point 字段如下
      - lat: 纬度，必需
      - lng: 经度，必需
      - name: 可选，标记点名称，type=marker 可用
      - address: 可选，标记点地址，type=marker 可用
      - phone: 可选，标记点电话，type=marker 可用
      - html: 可选，自定义 html 片段，用于显示标记点信息窗内容，显示在信息窗最下方
      - 其它自定义字段，可配合本地函数使用
    - options: 可选，覆盖物通用属性，若为空，则以默认设置展示
      - marker 详细参数请参考[官方文档](https://lbs.qq.com/javascript_v2/doc/markeroptions.html)
      - label 详细参数请参考[官方文档](https://lbs.qq.com/javascript_v2/doc/labeloptions.html)
      - circle 详细参数请参考[官方文档](https://lbs.qq.com/javascript_v2/doc/circleoptions.html)
      - poyline 详细参数请参考[官方文档](https://lbs.qq.com/javascript_v2/doc/polylineoptions.html)
      - polygon 详细参考请参考[官方文档](https://lbs.qq.com/javascript_v2/doc/polygonoptions.html)
- 更多详细使用案例请参考本组件[演示地址](https://workbench.wuyuan.io/proj/18425#102)