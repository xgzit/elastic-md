# 30-环境-Windows集群部署

#### 部署集群

一、创建 elasticsearch-cluster 文件夹

创建 elasticsearch-7.8.0-cluster 文件夹，在内部复制三个 elasticsearch 服务。

![](/article-images/131b23b8ea113ce0.png)

二、修改集群文件目录中每个节点的 config/elasticsearch.yml 配置文件

**node-1001 节点**

```yaml
#节点 1 的配置信息：
#集群名称，节点之间要保持一致
cluster.name: my-elasticsearch
#节点名称，集群内要唯一
node.name: node-1001
node.master: true
node.data: true
#ip 地址
network.host: localhost
#http 端口
http.port: 1001
#tcp 监听端口
transport.tcp.port: 9301
#discovery.seed_hosts: ["localhost:9301", "localhost:9302","localhost:9303"]
#discovery.zen.fd.ping_timeout: 1m
#discovery.zen.fd.ping_retries: 5
#集群内的可以被选为主节点的节点列表
#cluster.initial_master_nodes: ["node-1", "node-2","node-3"]
#跨域配置
#action.destructive_requires_name: true
http.cors.enabled: true
http.cors.allow-origin: "*"
```

**node-1002 节点**

```yaml
#节点 2 的配置信息：
#集群名称，节点之间要保持一致
cluster.name: my-elasticsearch
#节点名称，集群内要唯一
node.name: node-1002
node.master: true
node.data: true
#ip 地址
network.host: localhost
#http 端口
http.port: 1002
#tcp 监听端口
transport.tcp.port: 9302
discovery.seed_hosts: ["localhost:9301"]
discovery.zen.fd.ping_timeout: 1m
discovery.zen.fd.ping_retries: 5
#集群内的可以被选为主节点的节点列表
#cluster.initial_master_nodes: ["node-1", "node-2","node-3"]
#跨域配置
#action.destructive_requires_name: true
http.cors.enabled: true
http.cors.allow-origin: "*"
```

**node-1003 节点**

```yaml
#节点 3 的配置信息：
#集群名称，节点之间要保持一致
cluster.name: my-elasticsearch
#节点名称，集群内要唯一
node.name: node-1003
node.master: true
node.data: true
#ip 地址
network.host: localhost
#http 端口
http.port: 1003
#tcp 监听端口
transport.tcp.port: 9303
#候选主节点的地址，在开启服务后可以被选为主节点
discovery.seed_hosts: ["localhost:9301", "localhost:9302"]
discovery.zen.fd.ping_timeout: 1m
discovery.zen.fd.ping_retries: 5
#集群内的可以被选为主节点的节点列表
#cluster.initial_master_nodes: ["node-1", "node-2","node-3"]
#跨域配置
#action.destructive_requires_name: true
http.cors.enabled: true
http.cors.allow-origin: "*"
```

三、如果有必要，删除每个节点中的 data 目录中所有内容 。

#### 启动集群

分别依次双击执行节点的bin/elasticsearch.bat, 启动节点服务器（可以编写一个脚本启动），启动后，会自动加入指定名称的集群。

#### 测试集群

一、用Postman，查看集群状态

1.  `GET http://127.0.0.1:1001/_cluster/health`
2.  `GET http://127.0.0.1:1002/_cluster/health`
3.  `GET http://127.0.0.1:1003/_cluster/health`

返回结果皆为如下：

```json
{
    "cluster_name": "my-application",
    "status": "green",
    "timed_out": false,
    "number_of_nodes": 3,
    "number_of_data_nodes": 3,
    "active_primary_shards": 0,
    "active_shards": 0,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 0,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 100.0
}
```

**status字段**指示着当前集群在总体上是否工作正常。它的三种颜色含义如下：

1.  green：所有的主分片和副本分片都正常运行。
2.  yellow：所有的主分片都正常运行，但不是所有的副本分片都正常运行。
3.  red：有主分片没能正常运行。

二、用Postman，在一节点增加索引，另一节点获取索引

向集群中的node-1001节点增加索引：

```json
#PUT http://127.0.0.1:1001/user
```

返回结果：

```json
{
    "acknowledged": true,
    "shards_acknowledged": true,
    "index": "user"
}
```

向集群中的node-1003节点获取索引：

```json
#GET http://127.0.0.1:1003/user
```

返回结果：

```json
{
    "user": {
        "aliases": {},
        "mappings": {},
        "settings": {
            "index": {
                "creation_date": "1617993035885",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "XJKERwQlSJ6aUxZEN2EV0w",
                "version": {
                    "created": "7080099"
                },
                "provided_name": "user"
            }
        }
    }
}
```

如果在1003创建索引，同样在1001也能获取索引信息，这就是集群能力。
