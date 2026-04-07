import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import os

# Set global styles for academic visuals
plt.rcParams.update({
    'font.size': 10,
    'axes.titlesize': 12,
    'axes.labelsize': 10,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
    'figure.titlesize': 14,
    'font.family': 'sans-serif',
    'axes.spines.top': False,
    'axes.spines.right': False
})

output_dir = "thesis_visuals"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def save_fig(name):
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, f"{name}.svg"), format='svg', bbox_inches='tight')
    plt.close()

# --- Figure 4.1: Stress Class Distribution ---
def fig_4_1():
    classes = ['Yüksek (High)', 'Düşük (Low)', 'Orta (Medium)']
    counts = [65, 249, 286]
    
    plt.figure(figsize=(7, 5))
    bars = plt.bar(classes, counts, color=['#555555', '#bbbbbb', '#888888'], edgecolor='black', linewidth=0.5)
    plt.ylabel('Örnek Sayısı')
    plt.xlabel('Stres Seviyesi')
    plt.title('Şekil 4.1. Stres sınıf dağılım grafiği (Test Seti)')
    
    # Add values on top of bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 5, yval, ha='center', va='bottom')
    
    save_fig("fig_4_1_distribution")

# --- Figure 4.2: Model Performance Comparison ---
def fig_4_2():
    models = ['Logistik Regresyon', 'Random Forest', 'XGBoost']
    cv_f1 = [0.9093, 0.7748, 0.8257]
    test_acc = [0.9083, 0.8133, 0.8733]
    test_f1 = [0.9036, 0.7257, 0.8419]
    
    x = np.arange(len(models))
    width = 0.25
    
    plt.figure(figsize=(9, 6))
    plt.bar(x - width, cv_f1, width, label='CV Macro F1', color='#444444', edgecolor='black')
    plt.bar(x, test_acc, width, label='Test Doğruluğu', color='#888888', edgecolor='black')
    plt.bar(x + width, test_f1, width, label='Test Macro F1', color='#cccccc', edgecolor='black')
    
    plt.ylabel('Metrik Değeri (0–1)')
    plt.title('Şekil 4.2. Model performans karşılaştırma grafiği')
    plt.xticks(x, models)
    plt.legend(loc='lower right', frameon=True)
    plt.ylim(0, 1.1)
    
    save_fig("fig_4_2_comparison")

# --- Figure 4.3: Confusion Matrix ---
def fig_4_3():
    # Rows: Actual, Columns: Predicted
    matrix = np.array([
        [63, 0, 2],    # Actual High
        [0, 228, 21],  # Actual Low
        [14, 18, 254]  # Actual Medium
    ])
    
    labels = ['Yüksek', 'Düşük', 'Orta']
    
    plt.figure(figsize=(7, 6))
    sns.heatmap(matrix, annot=True, fmt='d', cmap='Greys', 
                xticklabels=labels, yticklabels=labels,
                cbar=False, linewidths=1, linecolor='black')
    
    plt.xlabel('Tahmin Edilen Sınıf')
    plt.ylabel('Gerçek Sınıf')
    plt.title('Şekil 4.3. Karışıklık Matrisi')
    
    save_fig("fig_4_3_confusion_matrix")

# --- Figure 4.4: Feature Importance Ranking ---
def fig_4_4():
    # Real coefficients retrieved from the model
    # Features: ["Age", "Study_Hours", "Class_Attendance", "Exam_Frequency", "Assignment_Load", "Sleep_Hours", "Social_Media_Use", "Screen_Time", "Peer_Pressure", "Family_Support", "Anxiety_Level"]
    coefs = np.array([
        [-0.12353612180029587, -0.04525879205840712, 0.016702155515055852, 3.280631690458989, 3.4689195986128714, -2.0227956248345778, 3.096804835249467, 4.175939279170709, -0.03494103550697921, -3.4217095049416923, 3.332240597905967],
        [0.055030361822303205, 0.025576182649151902, -0.02023834908088345, -3.2890153140078926, -3.3541687328692698, 2.026316067924158, -2.970516663127977, -4.053885960986178, 0.055211249788724465, 3.2879340022242998, -3.2857423603613833],
        [0.06850575997799283, 0.019682609409257024, 0.003536193565827, 0.008383623548904477, -0.11475086574359697, -0.003520443089588943, -0.12628817212149315, -0.12205331818452622, -0.020270214281744962, 0.13377550271739544, -0.046498237544584736]
    ])
    
    # Calculate absolute mean importance across the 3 classes
    importance = np.mean(np.abs(coefs), axis=0)
    
    features = [
        "Yaş", "Çalışma Saatleri", "Derse Katılım", "Sınav Sıklığı", "Ödev Yükü", 
        "Uyku Saatleri", "Sosyal Medya Kullanımı", "Ekran Süresi", "Akran Baskısı", 
        "Aile Desteği", "Kaygı Seviyesi"
    ]
    
    # Sort by importance
    sorted_idx = np.argsort(importance)
    sorted_features = [features[i] for i in sorted_idx]
    sorted_importance = [importance[i] for i in sorted_idx]
    
    plt.figure(figsize=(10, 7))
    plt.barh(sorted_features, sorted_importance, color='#777777', edgecolor='black')
    plt.xlabel('Ortalama Katsayı Büyüklüğü (Importance)')
    plt.title('Şekil 4.4. Değişken etkisi / önem sıralaması (Logistic Regression)')
    
    save_fig("fig_4_4_importance")

if __name__ == "__main__":
    print("Generating Figure 4.1...")
    fig_4_1()
    print("Generating Figure 4.2...")
    fig_4_2()
    print("Generating Figure 4.3...")
    fig_4_3()
    print("Generating Figure 4.4...")
    fig_4_4()
    print("All figures generated in thesis_visuals/ as SVG files.")
