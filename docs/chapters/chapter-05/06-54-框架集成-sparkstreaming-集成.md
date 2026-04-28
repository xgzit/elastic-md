# 54-框架集成-SparkStreaming-集成

Spark Streaming 是Spark core API的扩展，支持实时数据流的处理，并且具有可扩展，高吞吐量，容错的特点。数据可以从许多来源获取,如Kafka， Flume，Kinesis或TCP sockets，并且可以使用复杂的算法进行处理，这些算法使用诸如 map，reduce，join和 window等高级函数表示。最后，处理后的数据可以推送到文件系统，数据库等。实际上，您可以将Spark的机器学习和图形处理算法应用于数据流。

一、创建Maven项目。

二、修改 pom 文件，增加依赖关系。

```xml
<?xml version="1.0" encoding="utf-8"?>
<project
    xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.lun.es</groupId>
    <artifactId>sparkstreaming-elasticsearch</artifactId>
    <version>1.0</version>
    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-core_2.12</artifactId>
            <version>3.0.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-streaming_2.12</artifactId>
            <version>3.0.0</version>
        </dependency>
        <dependency>
            <groupId>org.elasticsearch</groupId>
            <artifactId>elasticsearch</artifactId>
            <version>7.8.0</version>
        </dependency>
        <!-- elasticsearch 的客户端 -->
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-high-level-client</artifactId>
            <version>7.8.0</version>
        </dependency>
        <!-- elasticsearch 依赖 2.x 的 log4j -->
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <version>2.8.2</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.8.2</version>
        </dependency>
        <!-- <dependency>-->
        <!-- <groupId>com.fasterxml.jackson.core</groupId>-->
        <!-- <artifactId>jackson-databind</artifactId>-->
        <!-- <version>2.11.1</version>-->
        <!-- </dependency>-->
        <!-- &lt;!&ndash; junit 单元测试 &ndash;&gt;-->
        <!-- <dependency>-->
        <!-- <groupId>junit</groupId>-->
        <!-- <artifactId>junit</artifactId>-->
        <!-- <version>4.12</version>-->
        <!-- </dependency>-->
    </dependencies>
</project>
```

三、功能实现

```scala
import org.apache.http.HttpHost
import org.apache.spark.SparkConf
import org.apache.spark.streaming.dstream.ReceiverInputDStream
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.elasticsearch.action.index.IndexRequest
import org.elasticsearch.client.indices.CreateIndexRequest
import org.elasticsearch.client.{RequestOptions, RestClient, RestHighLevelClient}
import org.elasticsearch.common.xcontent.XContentType
import java.util.Date

object SparkStreamingESTest {

    def main(args: Array[String]): Unit = {
        val sparkConf = new SparkConf().setMaster("local[*]").setAppName("ESTest")
        val ssc = new StreamingContext(sparkConf, Seconds(3))
        val ds: ReceiverInputDStream[String] = ssc.socketTextStream("localhost", 9999)
        ds.foreachRDD(
            rdd => {
                println("*************** " + new Date())
                rdd.foreach(
                    data => {
                        val client = new RestHighLevelClient(RestClient.builder(new HttpHost("localhost", 9200, "http")));
                        // 新增文档 - 请求对象
                        val request = new IndexRequest();

                        // 设置索引及唯一性标识
                        val ss = data.split(" ")
                        println("ss = " + ss.mkString(","))
                        request.index("sparkstreaming").id(ss(0));

                        val productJson =
                            s"""
                            | { "data":"${ss(1)}" }
                            |""".stripMargin;

                        // 添加文档数据，数据格式为 JSON 格式
                        request.source(productJson,XContentType.JSON);

                        // 客户端发送请求，获取响应对象
                        val response = client.index(request,
                        RequestOptions.DEFAULT);
                        System.out.println("_index:" + response.getIndex());
                        System.out.println("_id:" + response.getId());
                        System.out.println("_result:" + response.getResult());
                        client.close()
                    }
                )
            }
        )
        ssc.start()
        ssc.awaitTermination()
    }
}
```
