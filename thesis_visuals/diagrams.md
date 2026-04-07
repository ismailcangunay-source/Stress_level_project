# Tez Yazılım / Sistem Diyagramları

Bu dosya, "Üniversite Öğrencileri İçin Yapay Zeka Destekli Stres Tahmin Sistemi" tezi için gerekli olan sistem mimarisi ve akış diyagramlarını Mermaid formatında içermektedir.

---

### Şekil 3.1. Sistem mimarisi diyagramı

```mermaid
graph LR
    User["Öğrenci Kullanıcı"] --> Web["Web Arayüzü (Frontend)"]
    Web --> API["API / Sunucu (Backend)"]
    API --> Pre["Veri Doğrulama / Ön İşleme"]
    Pre --> Model["Logistic Regression Modeli"]
    Model --> DB[("Veritabanı")]
    API --> Res["Sonuç Ekranı / Dashboard"]
    DB --> Res["Sonuç Ekranı / Dashboard"]
```

---

### Şekil 3.2. Use Case diyagramı

```mermaid
useCaseDiagram
    actor Student as "Öğrenci Kullanıcı"
    
    package System {
        usecase UC1 as "Kayıt Ol"
        usecase UC2 as "Giriş Yap"
        usecase UC3 as "Stres Değerlendirme Formu Doldur"
        usecase UC4 as "Değerlendirmeyi Gönder"
        usecase UC5 as "Tahmin Edilen Stres Seviyesini Görüntüle"
        usecase UC6 as "Önerileri Görüntüle"
        usecase UC7 as "Geçmiş Kayıtları Görüntüle"
        usecase UC8 as "Dashboard / Trendleri Görüntüle"
        usecase UC9 as "Çıkış Yap"
    }
    
    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7
    Student --> UC8
    Student --> UC9
```

---

### Şekil 3.3. Veri akış diyagramı (DFD)

```mermaid
graph TD
    User["Öğrenci Kullanıcı"] -- "Form Verileri" --> Form["Stres Değerlendirme Formu"]
    Form -- "Girdi Verisi" --> API["API Sunucusu"]
    API -- "Ham Veri" --> Pre["Veri Ön İşleme"]
    Pre -- "İşlenmiş Veri" --> Model["Logistic Regression Modeli"]
    Model -- "Tahmin Skoru / Seviye" --> Log["Sonuç Üretimi"]
    Log -- "Girdi Kaydı" --> DB[("Veritabanı")]
    Log -- "Görselleştirme" --> Res["Sonuç Ekranı"]
    DB -- "Geçmiş Veriler" --> Dash["Dashboard Ekranı / Geçmiş"]
```

---

### Şekil 3.4. Varlık-İlişki Diyagramı (ERD)

```mermaid
erDiagram
    User ||--o{ StressAssessment : "sahiptir"
    
    User {
        int user_id PK
        string name
        string surname
        string email
        string password_hash
        datetime created_at
    }
    
    StressAssessment {
        int assessment_id PK
        int user_id FK
        float age
        string gender
        float study_hours
        float class_attendance
        float exam_frequency
        float assignment_load
        float sleep_hours
        float physical_exercise
        float social_media_use
        float screen_time
        float peer_pressure
        float family_support
        float anxiety_level
        string predicted_stress_level
        string recommendation_text
        datetime created_at
    }
```

---

### Şekil 3.5. Kullanıcı akış şeması

```mermaid
flowchart TD
    Start([Başlangıç / Landing Page]) --> Auth{Kayıtlı mı?}
    Auth -- Hayır --> Reg[Kayıt Ol] --> Login[Giriş Yap]
    Auth -- Evet --> Login
    Login --> Form[Stres Değerlendirme Formu]
    Form --> Submit[Gönder]
    Submit --> Proc[Backend İşleme]
    Proc --> Result[Sonuç Ekranı]
    Result --> Dash[Dashboard / Geçmiş]
    Dash --> Logout[Çıkış Yap]
    Logout --> End([Bitiş])
    
    Dash -- "Yeni Test" --> Form
```
