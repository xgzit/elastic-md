# 48-进阶-文档展示-Kibana

Kibana是一个免费且开放的用户界面，能够让你对Elasticsearch 数据进行可视化，并让你在Elastic Stack 中进行导航。你可以进行各种操作，从跟踪查询负载，到理解请求如何流经你的整个应用，都能轻松完成。

[Kibana下载网址](https://artifacts.elastic.co/downloads/kibana/kibana-7.8.0-windows-x86_64.zip)

一、解压缩下载的 zip 文件。

二、修改 config/kibana.yml 文件。

```yaml
# 默认端口
server.port: 5601
# ES 服务器的地址
elasticsearch.hosts: ["http://localhost:9200"]
# 索引名
kibana.index: ".kibana"
# 支持中文
i18n.locale: "zh-CN"
```

三、Windows 环境下执行 bin/kibana.bat 文件。（首次启动有点耗时）

四、通过浏览器访问：http://localhost:5601。

![](/article-images/6bb791ee3106d2b3.png)
