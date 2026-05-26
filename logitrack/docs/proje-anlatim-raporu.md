# LogiTrack Control Tower Proje Anlatımı Raporu

## 1. Projenin Amacı ve Hizmet Ettiği Alan

LogiTrack Control Tower, lojistik operasyonlarını tek bir kontrol panelinden izlemek için geliştirilmiş full-stack bir portfolyo projesidir. Projenin ana amacı; teslimatların durumunu, gecikmeleri, araç konumlarını, kritik uyarıları ve operasyonel performans metriklerini gerçek zamana yakın biçimde görünür hale getirmektir.

Bu sistem özellikle bir lojistik operasyon ekibinin şu sorularına cevap verir:

- Bugün kaç teslimat aktif, gecikmiş veya tamamlanmış durumda?
- Hangi araçlar aktif, boşta, bakımda veya çevrimdışı?
- Hangi uyarılar operasyon ekibinin hemen müdahalesini gerektiriyor?
- Gecikmeler en çok hangi bölgelerde, sürücülerde veya araçlarda yoğunlaşıyor?
- Simüle edilen canlı olaylar veri tabanına ve arayüze nasıl yansıyor?

Proje gerçek bir kargo şirketi verisi kullanmaz. Demo amaçlı seed veriler, Python tabanlı olay simülatörü ve Kaggle uyumlu geçmiş veri import araçları ile gerçekçi bir lojistik ortamı taklit eder.

## 2. Genel Mimari

LogiTrack katmanlı bir mimariye sahiptir:

```text
Python Data Simulator
        |
        v
Redpanda / Kafka uyumlu mesaj kuyruğu
        |
        v
Python Stream Consumer
        |
        v
PostgreSQL
        |
        v
Spring Boot Backend API
        |
        +--> REST API
        +--> SSE canlı veri akışı
        +--> GraphQL analitik sorguları
        |
        v
React + TypeScript Micro-Frontend arayüzleri
```

Bu yapı sayesinde proje tek bir ekrandan ibaret değildir. Veri üretimi, veri saklama, backend servisleri, canlı veri iletimi, analitik sorgular ve kullanıcı arayüzleri ayrı sorumluluklara bölünmüştür.

## 3. Kullanılan Teknolojiler

### 3.1 Frontend Teknolojileri

**React**

React, kullanıcı arayüzlerini bileşenler halinde geliştirmemizi sağlayan JavaScript kütüphanesidir. Projede Dashboard, Deliveries, Alerts, Analytics ve Fleet ekranlarının tamamı React bileşenleri ile yazılmıştır.

React'in bize faydası:

- Ekranları küçük ve tekrar kullanılabilir parçalara ayırır.
- Veri değiştiğinde ilgili arayüz parçalarını otomatik günceller.
- Büyük dashboard uygulamalarında okunabilir ve sürdürülebilir yapı sağlar.

**TypeScript**

TypeScript, JavaScript'e tip sistemi ekleyen dildir. Projede teslimat, araç, sürücü, uyarı ve analitik cevap tipleri TypeScript ile modellenmiştir.

Bize faydası:

- API'den gelen verinin şekli daha güvenli kullanılır.
- Yanlış alan adı, eksik veri veya hatalı fonksiyon kullanımı geliştirme sırasında yakalanır.
- Frontend ve backend sözleşmesini daha anlaşılır hale getirir.

**Vite**

Vite, frontend geliştirme ve build aracıdır. React uygulamalarını hızlı başlatır, hızlı yeniler ve production build üretir.

Projede Vite ayrıca micro-frontend yapısını çalıştırmak için kullanılır. Shell ve remote uygulamaların her biri ayrı Vite uygulamasıdır.

**pnpm ve Monorepo Workspace**

Proje tek bir repository içinde birden fazla uygulama ve ortak paket barındırır. Bu yapıya monorepo denir. `pnpm-workspace.yaml` ile `apps/*` ve `packages/*` altındaki projeler aynı workspace içinde yönetilir.

pnpm'in bize faydası:

- Shell, remote uygulamalar ve ortak paketler aynı dependency yönetimini paylaşır.
- `@logitrack/ui`, `@logitrack/types` ve `@logitrack/api-client` gibi workspace paketleri uygulamalar arasında doğrudan kullanılabilir.
- Build, test ve lint komutları root `package.json` üzerinden toplu çalıştırılabilir.

**React Router**

React Router, sayfalar arası geçişi yönetir. Projede şu rotalar bulunur:

- `/dashboard`
- `/deliveries`
- `/alerts`
- `/analytics`
- `/fleet`
- `/fleet/vehicles/:vehicleId`

**TanStack Query**

TanStack Query, frontend tarafında API verilerini çekmek, cachelemek, tekrar sorgulamak ve güncellemek için kullanılır.

Projede örnek kullanımlar:

- Dashboard KPI verilerini çekmek.
- Teslimat listesini almak.
- Uyarı listesini filtrelemek.
- Araç listesini ve araç detayını almak.
- SSE ile gelen canlı veriyi query cache içine yazmak.

Bize faydası:

- Her bileşende manuel loading/error/cache yönetimi yazmayız.
- Aynı veri tekrar istendiğinde cache üzerinden daha hızlı gösterilir.
- Canlı veri geldiğinde ekran verisi merkezi cache üzerinden güncellenir.

**Ortak UI, Types ve API Client Paketleri**

Projede frontend kodu sadece uygulama klasörlerinde dağınık durmaz; ortak ihtiyaçlar paketlere ayrılmıştır:

- `@logitrack/ui`: Button, Card, Badge, Table, PageHeader, EmptyState, StateMessage gibi tekrar kullanılabilir arayüz bileşenleri.
- `@logitrack/types`: Delivery, Vehicle, Alert, Analytics gibi ortak TypeScript tipleri.
- `@logitrack/api-client`: REST çağrıları, GraphQL çağrısı, query key'ler ve SSE helper fonksiyonları.

Bu ayrım kod tekrarını azaltır ve remote uygulamaların aynı veri sözleşmesini kullanmasını sağlar.

**Lucide React**

Sidebar ikonları gibi arayüz ikonları için kullanılır. Örneğin Dashboard, Deliveries, Alerts, Analytics ve Fleet menü ikonları lucide-react paketinden gelir.

**Recharts, Plotly ve D3**

Veri görselleştirme için kullanılır:

- Recharts: Dashboard içindeki basit durum dağılım grafikleri.
- Plotly: Analytics ekranındaki delay trend çizgi grafikleri.
- D3: Analytics ekranındaki bölgesel gecikme heatmap renk skalası.

**React Leaflet ve Leaflet**

Fleet Map ekranında araçları harita üzerinde göstermek için kullanılır. OpenStreetMap tile katmanı üzerinden araç marker'ları çizilir.

### 3.2 Frontend Mimari: Micro-Frontend

Micro-frontend, büyük frontend uygulamasını birden fazla küçük uygulamaya bölme yaklaşımıdır. Backend tarafındaki microservice fikrinin frontend karşılığı gibi düşünülebilir.

Projede yapı şöyledir:

- Shell uygulaması: Ana layout, sidebar, topbar, global provider'lar ve routing.
- Delivery Management remote: Teslimat ekranı.
- Alert Center remote: Uyarı ekranı.
- Analytics remote: Analitik ekranı.
- Fleet Dashboard remote: Filo haritası ve araç detay ekranı.

Bu remote uygulamalar Vite Module Federation ile runtime sırasında shell içine yüklenir. Yani shell uygulaması çalışırken örneğin `/analytics` rotasına gidildiğinde Analytics uygulamasının `remoteEntry.js` dosyası yüklenir ve sayfa shell içinde gösterilir.

Bize faydası:

- Her alan bağımsız geliştirilebilir.
- Büyük frontend tek parça olmak zorunda kalmaz.
- Bir remote bozulduğunda shell ve diğer ekranlar çalışmaya devam edebilir.
- Gerçek kurumsal projelerde farklı ekiplerin farklı ekranları sahiplenmesine benzer bir yapı sunar.

### 3.3 Backend Teknolojileri

**Java 21**

Backend uygulaması Java 21 ile geliştirilmiştir. Java güçlü tip sistemi, geniş ekosistemi ve kurumsal backendlerde yaygın kullanımı nedeniyle tercih edilir.

**Spring Boot**

Spring Boot, Java ile hızlı backend servisleri geliştirmeyi sağlayan framework'tür. Projede backend-api servisi Spring Boot ile yazılmıştır.

Kullanılan Spring parçaları:

- Spring Web: REST endpoint'leri için.
- Spring Data JPA: PostgreSQL tablolarına entity/repository üzerinden erişmek için.
- Spring GraphQL: GraphQL endpoint'i için.
- Spring Validation: İstek ve veri doğrulama altyapısı için.

**Maven**

Maven, Java backend tarafında dependency yönetimi ve build aracıdır. `services/backend-api/pom.xml` dosyası backend'in kullandığı Spring Boot, PostgreSQL driver ve test bağımlılıklarını tanımlar.

**Spring Data JPA ve Hibernate**

JPA, Java nesneleri ile ilişkisel veri tabanı tabloları arasında köprü kuran standarttır. Hibernate ise JPA'nın yaygın kullanılan implementasyonudur.

Projede entity sınıfları PostgreSQL tablolarını temsil eder, repository sınıfları ise veri tabanı sorgularını daha düzenli yazmamızı sağlar. `ddl-auto: validate` ayarı kullanıldığı için Hibernate tabloyu otomatik üretmez; mevcut SQL şemasının Java entity'leriyle uyumlu olup olmadığını doğrular.

**CORS**

CORS, tarayıcının farklı origin'ler arasındaki istekleri nasıl yöneteceğini belirleyen güvenlik mekanizmasıdır. Frontend `localhost:5173` üzerinde, backend `localhost:8080` üzerinde çalıştığı için backend tarafında izin verilen origin listesi tanımlanmıştır.

**REST API**

REST, HTTP üzerinden kaynak odaklı veri alışverişi yapma yaklaşımıdır. Projede birçok ekran REST endpoint'leri ile veri alır.

Örnek endpoint'ler:

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/deliveries`
- `GET /api/alerts`
- `PATCH /api/alerts/{id}/resolve`
- `GET /api/vehicles`
- `GET /api/vehicles/{id}`
- `GET /api/analytics/summary`

REST'i neden kullanıyoruz?

- Basit ve yaygın bir standarttır.
- Listeleme, detay görme, güncelleme gibi klasik işlemler için uygundur.
- Frontend tarafında fetch/TanStack Query ile kolay tüketilir.

**GraphQL**

GraphQL, istemcinin ihtiyaç duyduğu veri alanlarını tek bir sorgu ile tanımlamasını sağlayan API sorgu dilidir. REST'te genellikle endpoint ne döndürüyorsa onu alırız. GraphQL'de ise istemci, ihtiyacı olan alanları sorgu içinde belirtir.

Projede GraphQL şu endpoint üzerinden kullanılır:

- `POST /graphql`

Kullanılan ana sorgu:

- `deliveryAnalytics(from, to, region)`

Bu sorgu Analytics remote tarafından çağrılır ve şu verileri getirir:

- Özet metrikler
- Gecikme trendi
- Bölge kırılımı
- Sürücü performansı
- Araç performansı

GraphQL'i neden burada kullanıyoruz?

- Analytics ekranı birden fazla ilişkili veri grubunu tek seferde ister.
- REST ile ayrı ayrı endpoint'lere bölünebilecek analitik veriler tek sözleşmede toplanır.
- Filtreler `from`, `to`, `region` değişkenleriyle aynı sorguya uygulanır.

GraphQL'in temelinde ne var?

GraphQL bir transport protokolü değildir; genellikle HTTP üzerinden çalışır. Temelinde şema vardır. Şema, backend'in hangi tipleri ve hangi sorguları desteklediğini söyler. Projede `schema.graphqls` dosyasında `Query`, `AnalyticsSummary`, `DelayTrend`, `RegionBreakdown`, `DriverPerformance` ve `VehiclePerformance` tipleri tanımlıdır.

### 3.4 Database Teknolojileri

**PostgreSQL**

PostgreSQL ilişkisel veri tabanıdır. Projede operasyonel verilerin ana kaynağıdır.

Ana tablolar:

- `regions`
- `drivers`
- `warehouses`
- `vehicles`
- `deliveries`
- `vehicle_location_events`
- `delivery_events`
- `alerts`

PostgreSQL neden kullanılıyor?

- Teslimat, araç, sürücü ve depo gibi ilişkili verileri tutmak için uygundur.
- Foreign key ilişkileriyle veri bütünlüğü sağlar.
- Analitik sorgular için aggregation, grouping ve filtering özellikleri güçlüdür.
- Spring Data JPA ile backend tarafında rahat entegre olur.

**Migration ve Seed SQL**

`database/migrations/001_init_schema.sql` dosyası tablo yapısını oluşturur. `database/seed/001_seed_demo_data.sql` dosyası demo verileri ekler.

Bu yaklaşım bize şunu sağlar:

- Proje Docker Compose ile ayağa kalktığında aynı başlangıç verisi oluşur.
- Geliştiriciler aynı veri modeli üzerinden çalışır.
- Demo ve test ortamı tahmin edilebilir hale gelir.

### 3.5 Streaming ve Canlı Veri Teknolojileri

**Redpanda / Kafka uyumlu mesajlaşma**

Redpanda, Kafka protokolüyle uyumlu çalışan bir streaming platformudur. Projede simüle edilen lojistik olayları topic'lere gönderilir.

Topic'ler:

- `vehicle-location-updated`
- `delivery-status-changed`
- `delivery-delayed`
- `alert-created`

Mesaj kuyruğu neden kullanılıyor?

- Veri üreten servis ile veriyi işleyen servis birbirinden ayrılır.
- Simülatör olay üretir; consumer kendi hızında bu olayları işler.
- Gerçek sistemlerde GPS, IoT, sipariş veya teslimat olayları farklı kaynaklardan akabilir. Bu proje o mimariyi demo eder.

**Python Data Simulator**

`services/data-simulator/main.py` dosyasında yer alır. Rastgele araç konumu, teslimat durumu, gecikme ve uyarı olayları üretir. Bu olayları Redpanda topic'lerine gönderir.

Kullandığı temel paket:

- `confluent-kafka`: Kafka/Redpanda topic'lerine mesaj üretmek için.

**Python Stream Consumer**

`services/stream-consumer/main.py` dosyasında yer alır. Redpanda topic'lerini dinler, gelen olayları işler ve PostgreSQL'e yazar.

Örnek:

- Araç konumu olayı gelirse `vehicle_location_events` tablosuna kayıt ekler ve `vehicles` tablosundaki son konumu günceller.
- Teslimat gecikmesi olayı gelirse teslimatı `DELAYED` yapar ve gecikme dakikasını günceller.
- Uyarı olayı gelirse `alerts` tablosuna yeni uyarı ekler.

Kullandığı temel paketler:

- `confluent-kafka`: Topic'lerden mesaj tüketmek için.
- `psycopg`: PostgreSQL'e bağlanmak ve SQL çalıştırmak için.

### 3.6 SSE, WebSocket ve Asenkron Mantık

**SSE nedir?**

SSE, Server-Sent Events demektir. Sunucunun tarayıcıya tek yönlü canlı veri göndermesini sağlar. Tarayıcı tarafında `EventSource` API'si ile kullanılır.

Projede kullanılan SSE endpoint'leri:

- `GET /api/live/dashboard`
- `GET /api/live/alerts`
- `GET /api/live/vehicles`

SSE'yi nerede kullanıyoruz?

- Dashboard canlı KPI güncellemesi.
- Alert Center canlı uyarı listesi güncellemesi.
- Fleet Map canlı araç snapshot güncellemesi.

SSE neden faydalı?

- Dashboard gibi sunucudan istemciye sürekli veri akması gereken ekranlarda basittir.
- WebSocket'e göre daha az karmaşıktır.
- HTTP tabanlıdır ve tarayıcıda doğal destek vardır.
- Bu projede frontend'in sunucuya sürekli mesaj göndermesine gerek olmadığı için tek yönlü akış yeterlidir.

**WebSocket nedir?**

WebSocket, istemci ve sunucu arasında çift yönlü, sürekli açık bir bağlantı kurar. HTTP isteğiyle başlar, sonra bağlantı WebSocket protokolüne yükseltilir. Bu bağlantı üzerinden hem sunucu istemciye hem de istemci sunucuya anlık mesaj gönderebilir.

WebSocket hangi durumlarda tercih edilir?

- Chat uygulamaları
- Online oyunlar
- Canlı ortak düzenleme araçları
- Kullanıcının da anlık komut gönderdiği izleme panelleri

Bu projede WebSocket aktif olarak kullanılmıyor. Mimari notlarında canlı veri için SSE/WebSocket seçeneği geçiyor, fakat uygulanan canlı mekanizma SSE'dir. Çünkü LogiTrack'te canlı veri ihtiyacı ağırlıklı olarak sunucudan arayüze doğrudur. Kullanıcıdan sunucuya sürekli düşük gecikmeli mesaj akışı gerekmemektedir.

**Asenkron çalışma nedir?**

Asenkron çalışma, bir işlemin sonucunu beklerken tüm programı durdurmamak anlamına gelir. Örneğin frontend API çağrısı yaparken ekran tamamen kilitlenmez; veri gelince ilgili state/cache güncellenir.

Önemli ayrım: Asenkron mantık doğrudan "multithread" demek değildir.

- Multithread: Aynı anda birden fazla thread ile iş yürütme modelidir.
- Asenkron: Beklemeli işleri bloklamadan yönetme modelidir.

Asenkron sistemler bazen thread pool kullanır, bazen event loop kullanır, bazen işletim sistemi seviyesindeki non-blocking I/O mekanizmalarından faydalanır. Yani asenkronun temel fikri "aynı anda çok thread açmak" değil, "bekleme süresini boşa harcamadan başka işleri yapabilmek"tir.

Bu projede asenkron mantık nerelerde var?

- Frontend API çağrıları Promise/fetch mantığıyla asenkron çalışır.
- TanStack Query veri çekme, cache güncelleme ve refetch işlemlerini asenkron yönetir.
- EventSource ile SSE bağlantısından veri geldikçe callback'ler çalışır.
- Python simulator sürekli olay üretirken Redpanda'ya mesaj gönderir.
- Python consumer mesajları poll ederek işler ve veri tabanına yazar.
- Spring Boot HTTP isteklerini request/response modeliyle işler.

### 3.7 Internal Analytics: Streamlit

Streamlit, Python ile hızlı veri paneli geliştirmeyi sağlayan bir araçtır. Projede müşteri ekranı değildir; iç ekip için veri kalitesi ve analitik inceleme panelidir.

`analytics-service` şunları gösterir:

- Teslimat sayısı
- Gecikmiş teslimatlar
- Ortalama gecikme
- Zamanında teslim oranı
- Veri kalitesi kontrolleri
- Gecikme dağılımı
- Bölge kırılımı
- Sürücü ve araç sıralamaları

Kullandığı temel paketler:

- `streamlit`: İç analitik arayüzünü oluşturmak için.
- `pandas`: Veri tabanı sonuçlarını DataFrame olarak analiz etmek için.
- `psycopg`: PostgreSQL bağlantısı için.

### 3.8 DevOps, Test ve Kalite Araçları

**Docker ve Docker Compose**

Docker, servisleri izole container'lar içinde çalıştırır. Docker Compose ise birden fazla container'ı tek dosyada birlikte tanımlar ve ayağa kaldırır.

Projede Compose ile şu servisler birlikte çalışır:

- PostgreSQL
- Spring Boot backend
- Redpanda
- Python data simulator
- Python stream consumer
- Streamlit analytics service

Bu sayede sistem yalnızca frontend uygulaması olarak değil, çok servisli gerçekçi bir demo ortamı olarak çalışır.

**ESLint ve Prettier**

ESLint kod kalitesi ve olası hatalar için statik kontrol yapar. Prettier kod formatlama standardını korur.

**Vitest, React Testing Library ve jsdom**

Frontend testleri için kullanılır. Vitest test runner'dır. React Testing Library bileşenleri kullanıcının gördüğü davranışa yakın şekilde test etmeyi sağlar. jsdom ise tarayıcı ortamını Node.js içinde simüle eder.

**Maven Test Altyapısı**

Backend tarafında Spring Boot test bağımlılıkları ile servis ve controller testleri çalıştırılabilir.

## 4. Backend Yapısı

Backend `services/backend-api` klasöründedir.

Ana sorumlulukları:

- PostgreSQL'den veri okumak ve yazmak.
- REST endpoint'leri sunmak.
- GraphQL analitik sorgularını karşılamak.
- SSE endpoint'leri ile canlı snapshot akışı sağlamak.
- CORS ayarları ile frontend uygulamalarının API'ye erişmesine izin vermek.

Backend katmanları:

- `controller`: HTTP ve GraphQL endpoint girişleri.
- `service`: İş mantığı ve veri dönüştürme.
- `repository`: Veri tabanı erişimi.
- `entity`: PostgreSQL tablolarının Java karşılığı.
- `dto`: Frontend'e dönen veri şekilleri.
- `exception`: Hata cevapları ve global hata yönetimi.

## 5. Veri Modeli

Projede temel iş nesneleri şunlardır:

**Vehicle**

Teslimat aracını temsil eder. Plaka, araç tipi, kapasite, durum, atanmış sürücü ve son konum bilgilerini içerir.

**Driver**

Sürücüyü temsil eder. Ad, telefon, puan ve çalışma durumu gibi bilgiler taşır.

**Warehouse**

Teslimatın çıktığı depo veya lojistik merkezidir. Şehir, ilçe, koordinat ve kapasite bilgileri vardır.

**Delivery**

Sistemin ana takip nesnesidir. Takip numarası, durum, öncelik, bölge, araç, sürücü, tahmini teslim zamanı, gerçek teslim zamanı ve gecikme dakikasını içerir.

**Alert**

Operasyonel problemi temsil eder. Örneğin teslimat gecikmesi, araç çevrimdışı olması veya rota değişikliği gibi olaylar uyarı olarak görünür.

**VehicleLocationEvent**

Araçlardan gelen konum olaylarını temsil eder. Harita ve son konum takibi için kullanılır.

**DeliveryEvent**

Teslimat durum değişikliklerini temsil eder. Teslimatın hangi zamanda hangi duruma geçtiğini tarihçe olarak tutar.

## 6. Arayüzler ve Ekran Açıklamaları

### 6.1 Shell / Ana Uygulama

Shell uygulaması ana iskelettir. Sidebar, üst bar, sayfa alanı ve route yönetimi burada bulunur.

Menüde şu alanlar vardır:

- Dashboard
- Deliveries
- Alerts
- Analytics
- Fleet

Shell ayrıca micro-frontend remote uygulamalarını yükler. Örneğin kullanıcı `/fleet` rotasına gittiğinde Fleet Dashboard remote shell içine alınır.

### 6.2 Dashboard Overview

Dashboard ana operasyon özetidir.

Gösterdiği bilgiler:

- Toplam teslimat
- Aktif teslimat
- Gecikmiş teslimat
- Tamamlanan teslimat
- Aktif araç sayısı
- Aktif uyarı sayısı
- Teslimat durum dağılımı
- Son uyarılar

Kullandığı backend kaynakları:

- İlk veri için `GET /api/dashboard/summary`
- Canlı güncelleme için `GET /api/live/dashboard`

Bu ekranın amacı operasyon ekibine genel durumu hızlıca göstermektir.

### 6.3 Delivery Management

Teslimat yönetim ekranıdır. Teslimat kayıtlarını tablo halinde gösterir.

Gösterdiği bilgiler:

- Takip numarası
- Durum
- Öncelik
- Bölge
- Araç plakası
- Sürücü adı
- Tahmini teslim zamanı
- Gecikme dakikası

Kullandığı backend kaynağı:

- `GET /api/deliveries`

Tablo sanallaştırma desteklidir. Bu, çok sayıda satır olduğunda yalnızca görünen satırların render edilmesini sağlayarak performansı artırır.

### 6.4 Alert Center

Uyarı merkezi ekranıdır. Operasyonel problemleri listeler ve filtreler.

Özellikleri:

- Uyarıları severity değerine göre filtreleme: ALL, LOW, MEDIUM, HIGH, CRITICAL.
- Uyarı durumunu görme: UNRESOLVED veya RESOLVED.
- Uyarıyı resolve etme.
- SSE ile canlı uyarı güncellemesi alma.

Kullandığı backend kaynakları:

- `GET /api/alerts`
- `PATCH /api/alerts/{id}/resolve`
- `GET /api/live/alerts`

Bu ekran operasyon ekibinin müdahale gerektiren olayları yönetmesi için tasarlanmıştır.

### 6.5 Analytics

Analitik ekranı geçmiş teslimat performansını inceler.

Özellikleri:

- Tarih aralığı filtresi.
- Bölge filtresi.
- Toplam teslimat, gecikmiş teslimat, ortalama gecikme ve zamanında teslim oranı KPI'ları.
- Plotly ile gecikme trend grafiği.
- D3 renk skalasıyla bölge gecikme heatmap'i.
- Rota verimlilik tablosu.
- Bölge, sürücü ve araç performans tabloları.
- CSV export.

Kullandığı backend kaynağı:

- `POST /graphql`
- Sorgu: `deliveryAnalytics(from, to, region)`

Bu ekran REST yerine GraphQL kullanır. Çünkü çok parçalı analitik veri tek sorgu ile alınır.

### 6.6 Fleet Map

Filo harita ekranıdır. Araçları harita üzerinde gösterir.

Özellikleri:

- OpenStreetMap tabanlı harita.
- Araç durumuna göre marker renkleri.
- Canlı araç snapshot güncellemesi.
- Seçili araç paneli.
- Araç listesi tablosu.
- Araç detay sayfasına geçiş.

Kullandığı backend kaynakları:

- `GET /api/vehicles`
- `GET /api/live/vehicles`

Fleet Map'te gelen canlı marker güncellemeleri buffer edilir. Bunun amacı her olayda gereksiz render yapmamak ve harita performansını korumaktır.

### 6.7 Vehicle Detail

Tek bir aracın detay sayfasıdır.

Gösterdiği bilgiler:

- Plaka
- Araç tipi
- Kapasite
- Durum
- Atanmış sürücü
- Son enlem/boylam
- Son güncellenme zamanı
- Aracın haritadaki son konumu

Kullandığı backend kaynağı:

- `GET /api/vehicles/{id}`

## 7. Sistem Nasıl Çalışır?

1. Docker Compose PostgreSQL, backend-api, Redpanda, data-simulator, stream-consumer ve analytics-service servislerini ayağa kaldırır.
2. PostgreSQL başlangıçta migration ve seed SQL dosyalarıyla tablo/veri oluşturur.
3. Python data-simulator belirli aralıklarla rastgele lojistik olayları üretir.
4. Olaylar Redpanda topic'lerine gönderilir.
5. Python stream-consumer bu topic'leri dinler.
6. Consumer gelen olay türüne göre PostgreSQL tablolarını günceller.
7. Spring Boot backend PostgreSQL'den verileri okuyarak REST, SSE ve GraphQL endpoint'leri sunar.
8. React shell ve remote uygulamalar API'den veri çeker.
9. SSE endpoint'lerinden canlı veri geldikçe TanStack Query cache güncellenir.
10. Kullanıcı arayüzleri güncel operasyon durumunu gösterir.

## 8. Docker Compose Servisleri

Projede servisler Docker Compose ile birlikte çalıştırılır.

- `postgres`: PostgreSQL veri tabanı. Lokal port: `55432`.
- `backend-api`: Spring Boot backend. Lokal port: `8080`.
- `redpanda`: Kafka uyumlu mesaj broker'ı. Lokal port: `19092`.
- `data-simulator`: Python olay üretici servis.
- `stream-consumer`: Python olay tüketici ve PostgreSQL yazıcı servis.
- `analytics-service`: Streamlit iç analitik paneli. Lokal port: `8501`.

Frontend tarafı için ana portlar:

- Shell: `http://localhost:5173`
- Analytics remote: `http://localhost:5174`
- Fleet remote: `http://localhost:5175`
- Delivery remote: `http://localhost:5176`
- Alert remote: `http://localhost:5177`

## 9. API Yaklaşımı

Projede üç farklı API yaklaşımı vardır:

**REST**

Standart veri listeleme, detay ve güncelleme işlemleri için kullanılır. Dashboard, deliveries, alerts ve vehicles ekranlarının temel verileri REST ile gelir.

**SSE**

Sunucudan arayüze canlı veri akışı için kullanılır. Dashboard, alerts ve fleet ekranlarında canlı snapshot güncellemesi sağlar.

**GraphQL**

Analitik ekranında, birden fazla veri grubunu tek sorgu ile almak için kullanılır.

Bu üç yaklaşım aynı projede bilinçli olarak birlikte kullanılmıştır. Böylece proje yalnızca CRUD uygulaması değil; modern frontend-backend entegrasyon desenlerini gösteren bir kontrol kulesi örneği olur.

## 10. Performans ve Kalite Yaklaşımları

Projede performans ve kalite için şu yapı taşları bulunur:

- TanStack Query cache yönetimi.
- SSE güncellemelerinde coalescing/buffering.
- Fleet marker update buffer.
- Büyük tablolarda sanallaştırma.
- TypeScript tip güvenliği.
- Shared UI, shared types ve shared API client paketleri.
- Vitest ve React Testing Library testleri.
- Maven backend test altyapısı.
- API verification script'leri.
- Docker Compose ile tekrarlanabilir çalışma ortamı.

## 11. Klasör Yapısı Özeti

```text
apps/
  shell/                 Ana uygulama ve layout
  analytics/             Analytics micro-frontend
  fleet-dashboard/       Fleet Map ve araç detay micro-frontend
  delivery-management/   Teslimat yönetimi micro-frontend
  alert-center/          Uyarı merkezi micro-frontend

packages/
  api-client/            Ortak API çağrıları, query key'ler, SSE helper'ları
  types/                 Ortak TypeScript tipleri
  ui/                    Ortak UI bileşenleri

services/
  backend-api/           Spring Boot backend
  data-simulator/        Python olay üretici
  stream-consumer/       Python olay tüketici
  analytics-service/     Streamlit iç analitik panel

database/
  migrations/            Veri tabanı şema dosyaları
  seed/                  Demo veri dosyaları

docs/                    Mimari, API, veri ve proje dokümanları
```

## 12. Projenin Güçlü Yönleri

- Modern React ve TypeScript tabanlı frontend geliştirme gösterir.
- Micro-frontend mimarisiyle büyük ölçekli frontend yaklaşımını simüle eder.
- Spring Boot ve PostgreSQL ile gerçek backend/database entegrasyonu sunar.
- Redpanda/Kafka uyumlu streaming ile event-driven mimariyi gösterir.
- SSE ile canlı dashboard ve harita güncellemesi sağlar.
- GraphQL ile analitik veri sorgulama örneği sunar.
- Docker Compose ile çok servisli sistemi tek komutla ayağa kaldırır.
- Ortak UI, tip ve API client paketleriyle monorepo düzeni kurar.

## 13. Sınırlamalar ve Kapsam Dışı Alanlar

Bu proje portfolyo/demo kapsamındadır. Aşağıdaki alanlar bilinçli olarak kapsam dışında bırakılmıştır:

- Kullanıcı girişi ve authentication.
- Rol bazlı authorization.
- Gerçek GPS/IoT entegrasyonu.
- Production-grade güvenlik sertleştirmesi.
- Gerçek rota optimizasyon motoru.
- Public production deployment.
- Gerçek şirket verisi.

## 14. Kısa Özet

LogiTrack Control Tower; React, TypeScript, Vite Module Federation, Spring Boot, PostgreSQL, Redpanda, Python, SSE, GraphQL ve Streamlit teknolojilerini bir araya getiren modern bir lojistik kontrol kulesi projesidir. Proje, teslimat operasyonlarını dashboard, teslimat yönetimi, uyarı merkezi, analitik ve filo haritası ekranlarıyla izlenebilir hale getirir.

Temel değer önerisi; simüle edilen canlı lojistik olaylarının mesaj kuyruğu üzerinden işlenmesi, PostgreSQL'e yazılması, Spring Boot API katmanından REST/SSE/GraphQL olarak sunulması ve React micro-frontend arayüzlerinde kullanıcıya anlamlı operasyonel bilgi olarak gösterilmesidir.
