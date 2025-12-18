// Konfigurasi simulasi
const CONFIG = {
    DIAMAGNETIC: {
        name: "Diamagnetik",
        color: "#3498db",
        susceptibility: "≈ -10⁻⁵",
        description: "Material diamagnetik tidak memiliki momen magnetik permanen. Ketika medan magnet diterapkan, muncul momen magnetik induksi yang berlawanan arah dengan medan eksternal.",
        property: "Lemah dan menolak medan"
    },
    PARAMAGNETIC: {
        name: "Paramagnetik",
        color: "#e74c3c",
        susceptibility: "≈ +10⁻³",
        description: "Material paramagnetik memiliki momen magnetik permanen yang tersusun acak tanpa medan eksternal. Medan magnet menyelaraskan sebagian momen magnetik searah medan.",
        property: "Lemah dan menarik medan"
    },
    FERROMAGNETIC: {
        name: "Feromagnetik",
        color: "#2ecc71",
        susceptibility: ">> 1 (non-linear)",
        description: "Material feromagnetik memiliki domain magnetik dengan momen magnetik searah dalam setiap domain. Medan magnet memperbesar domain yang searah dan menghasilkan magnetisasi kuat.",
        property: "Kuat dan dapat mempertahankan magnetisasi"
    }
};

// State simulasi
let simulationState = {
    currentMaterial: "DIAMAGNETIC",
    externalField: 0,
    temperature: 300,
    magnetization: 0,
    atoms: [],
    domains: [],
    graphData: [],
    animationId: null
};

// Elemen DOM
const materialCanvas = document.getElementById('material-canvas');
const graphCanvas = document.getElementById('graph-canvas');
const fieldSlider = document.getElementById('field-slider');
const fieldValue = document.getElementById('field-value');
const tempSlider = document.getElementById('temp-slider');
const tempValue = document.getElementById('temp-value');
const fieldArrow = document.getElementById('field-arrow');
const materialInfo = document.getElementById('material-info');
const currentMaterialElement = document.getElementById('current-material');
const materialDescription = document.getElementById('material-description');
const susceptibilityValue = document.getElementById('susceptibility-value');
const magnetizationValue = document.getElementById('magnetization-value');
const directionArrow = document.getElementById('direction-arrow');
const directionText = document.getElementById('direction-text');
const materialProperty = document.getElementById('material-property');
const activeMaterialName = document.getElementById('active-material-name');
const tempControl = document.getElementById('temp-control');

// Konteks canvas
const materialCtx = materialCanvas.getContext('2d');
const graphCtx = graphCanvas.getContext('2d');

// Inisialisasi simulasi
function initSimulation() {
    createAtoms();
    createDomains();
    updateMaterialInfo();
    drawSimulation();
    drawGraph();
    setupEventListeners();
}

// Membuat atom-atom untuk visualisasi
function createAtoms() {
    simulationState.atoms = [];
    const atomCount = 150;
    const padding = 40;
    const width = materialCanvas.width - padding * 2;
    const height = materialCanvas.height - padding * 2;
    
    for (let i = 0; i < atomCount; i++) {
        simulationState.atoms.push({
            x: padding + Math.random() * width,
            y: padding + Math.random() * height,
            radius: 3,
            magneticMoment: {
                angle: 0,
                magnitude: 0,
                visible: false
            }
        });
    }
}

// Membuat domain untuk material feromagnetik
function createDomains() {
    simulationState.domains = [];
    if (simulationState.currentMaterial !== "FERROMAGNETIC") return;
    
    const domainCount = 6;
    const padding = 40;
    const width = materialCanvas.width - padding * 2;
    const height = materialCanvas.height - padding * 2;
    
    // Membagi area menjadi beberapa domain
    const cols = 3;
    const rows = 2;
    const domainWidth = width / cols;
    const domainHeight = height / rows;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const domainAngle = Math.random() * 2 * Math.PI;
            simulationState.domains.push({
                x: padding + col * domainWidth,
                y: padding + row * domainHeight,
                width: domainWidth,
                height: domainHeight,
                angle: domainAngle,
                magnetization: 0.2 + Math.random() * 0.3
            });
        }
    }
}

// Menggambar simulasi
function drawSimulation() {
    // Bersihkan canvas
    materialCtx.clearRect(0, 0, materialCanvas.width, materialCanvas.height);
    
    // Gambar latar belakang
    materialCtx.fillStyle = "#0f0f1a";
    materialCtx.fillRect(0, 0, materialCanvas.width, materialCanvas.height);
    
    // Gambar medan magnet eksternal
    drawExternalField();
    
    // Gambar berdasarkan jenis material
    switch (simulationState.currentMaterial) {
        case "DIAMAGNETIC":
            drawDiamagneticMaterial();
            break;
        case "PARAMAGNETIC":
            drawParamagneticMaterial();
            break;
        case "FERROMAGNETIC":
            drawFerromagneticMaterial();
            break;
    }
    
    // Gambar domain untuk feromagnetik
    if (simulationState.currentMaterial === "FERROMAGNETIC") {
        drawDomains();
    }
    
    // Gambar atom dan momen magnetik
    drawAtoms();
    
    // Gambar vektor magnetisasi total
    drawMagnetizationVector();
    
    // Perbarui magnetisasi
    calculateMagnetization();
    
    // Tambah data grafik
    addGraphData();
}

// Menggambar medan magnet eksternal
function drawExternalField() {
    const fieldStrength = simulationState.externalField / 100;
    
    // Gambar panah medan
    const arrowCount = 5;
    const arrowSpacing = materialCanvas.height / (arrowCount + 1);
    
    materialCtx.strokeStyle = "#2ecc71";
    materialCtx.lineWidth = 2;
    materialCtx.fillStyle = "#2ecc71";
    
    for (let i = 1; i <= arrowCount; i++) {
        const y = i * arrowSpacing;
        const arrowLength = 50 + fieldStrength * 100;
        
        // Garis panah (arah ke kanan = 0 radian)
        materialCtx.beginPath();
        materialCtx.moveTo(50, y);
        materialCtx.lineTo(50 + arrowLength, y);
        materialCtx.stroke();
        
        // Kepala panah
        materialCtx.beginPath();
        materialCtx.moveTo(50 + arrowLength, y);
        materialCtx.lineTo(50 + arrowLength - 10, y - 5);
        materialCtx.lineTo(50 + arrowLength - 10, y + 5);
        materialCtx.closePath();
        materialCtx.fill();
    }
    
    // Perbarui indikator panah
    const scaleFactor = 1 + fieldStrength * 0.5;
    fieldArrow.style.transform = `scale(${scaleFactor})`;
}

// Menggambar material diamagnetik
function drawDiamagneticMaterial() {
    const fieldStrength = simulationState.externalField / 100;
    
    simulationState.atoms.forEach(atom => {
        if (fieldStrength > 0) {
            // Diamagnetik: momen magnetik INDUKSI berlawanan arah medan
            // Medan ke kanan (0 radian) → momen ke kiri (π radian)
            atom.magneticMoment.angle = Math.PI; // 180 derajat (kiri)
            atom.magneticMoment.magnitude = fieldStrength * 0.3; // Efek kecil
            atom.magneticMoment.visible = true;
        } else {
            atom.magneticMoment.visible = false;
            atom.magneticMoment.magnitude = 0;
        }
    });
}

// Menggambar material paramagnetik
function drawParamagneticMaterial() {
    const fieldStrength = simulationState.externalField / 100;
    const temperature = simulationState.temperature;
    
    simulationState.atoms.forEach(atom => {
        // Momen magnetik selalu ada untuk paramagnetik
        atom.magneticMoment.visible = true;
        
        if (fieldStrength > 0) {
            // Arah medan: ke kanan (0 radian)
            const fieldDirection = 0;
            
            // Hitung faktor penyelarasan berdasarkan Hukum Curie
            // μB ~ 9.27e-24 J/T, k_B = 1.38e-23 J/K
            // Faktor = (μB)/(k_B T) * fieldStrength
            const muB = 9.27e-24;
            const kB = 1.38e-23;
            let alignmentFactor = 0;
            
            if (temperature > 0) {
                alignmentFactor = (muB * fieldStrength * 100) / (kB * temperature);
                alignmentFactor = Math.min(0.8, Math.max(0.1, alignmentFactor));
            } else {
                alignmentFactor = 0.8; // Suhu mendekati 0 K
            }
            
            // Magnitude berdasarkan alignment
            atom.magneticMoment.magnitude = 0.1 + alignmentFactor * 0.9;
            
            // Gabungkan arah acak dengan arah medan berdasarkan alignmentFactor
            const randomAngle = Math.random() * 2 * Math.PI;
            
            // Interpolasi antara acak dan searah medan
            // alignmentFactor = 0 → semua acak
            // alignmentFactor = 1 → semua searah medan
            const finalAngle = randomAngle * (1 - alignmentFactor) + fieldDirection * alignmentFactor;
            
            atom.magneticMoment.angle = finalAngle;
            
        } else {
            // Tanpa medan: benar-benar acak
            atom.magneticMoment.angle = Math.random() * 2 * Math.PI;
            atom.magneticMoment.magnitude = 0.2;
        }
    });
}

// Menggambar material feromagnetik
function drawFerromagneticMaterial() {
    const fieldStrength = simulationState.externalField / 100;
    const fieldDirection = 0; // Medan ke kanan
    
    // Perbarui domain berdasarkan medan
    simulationState.domains.forEach(domain => {
        // Domain dengan arah mendekati arah medan akan membesar
        const angleDiff = Math.abs(domain.angle - fieldDirection);
        const alignment = 1 - (angleDiff / Math.PI);
        
        // Domain yang searah medan membesar
        domain.magnetization = 0.2 + (alignment * fieldStrength * 0.8);
        
        // Domain yang tidak searah medan mengecil
        if (fieldStrength > 0.3 && alignment < 0.5) {
            domain.magnetization *= 0.5;
        }
        
        // Domain bisa berubah arah jika medan kuat
        if (fieldStrength > 0.7 && alignment < 0.3) {
            domain.angle = fieldDirection + (Math.random() - 0.5) * 0.5;
        }
    });
    
    // Atur momen magnetik atom berdasarkan domain
    simulationState.atoms.forEach(atom => {
        atom.magneticMoment.visible = true;
        
        // Temukan domain mana yang mengandung atom ini
        let atomDomain = null;
        for (const domain of simulationState.domains) {
            if (atom.x >= domain.x && atom.x <= domain.x + domain.width &&
                atom.y >= domain.y && atom.y <= domain.y + domain.height) {
                atomDomain = domain;
                break;
            }
        }
        
        if (atomDomain) {
            // Atom dalam domain memiliki momen magnetik searah domain
            atom.magneticMoment.angle = atomDomain.angle;
            atom.magneticMoment.magnitude = atomDomain.magnetization;
        } else {
            // Atom di luar domain
            atom.magneticMoment.angle = fieldDirection;
            atom.magneticMoment.magnitude = 0.5;
        }
    });
}

// Menggambar domain feromagnetik
function drawDomains() {
    simulationState.domains.forEach(domain => {
        // Gambar batas domain
        materialCtx.strokeStyle = `rgba(46, 204, 113, ${0.3 + domain.magnetization * 0.5})`;
        materialCtx.lineWidth = 2;
        materialCtx.setLineDash([5, 5]);
        materialCtx.strokeRect(domain.x, domain.y, domain.width, domain.height);
        materialCtx.setLineDash([]);
        
        // Gambar latar domain dengan transparansi berdasarkan magnetisasi
        materialCtx.fillStyle = `rgba(46, 204, 113, ${0.05 + domain.magnetization * 0.1})`;
        materialCtx.fillRect(domain.x, domain.y, domain.width, domain.height);
    });
}

// Menggambar atom dan momen magnetiknya
function drawAtoms() {
    simulationState.atoms.forEach(atom => {
        // Gambar atom
        materialCtx.fillStyle = CONFIG[simulationState.currentMaterial].color;
        materialCtx.beginPath();
        materialCtx.arc(atom.x, atom.y, atom.radius, 0, 2 * Math.PI);
        materialCtx.fill();
        
        // Gambar momen magnetik jika terlihat
        if (atom.magneticMoment.visible && atom.magneticMoment.magnitude > 0.01) {
            const arrowLength = 12 + atom.magneticMoment.magnitude * 20;
            const endX = atom.x + Math.cos(atom.magneticMoment.angle) * arrowLength;
            const endY = atom.y + Math.sin(atom.magneticMoment.angle) * arrowLength;
            
            // Gambar panah
            materialCtx.strokeStyle = "#e74c3c";
            materialCtx.lineWidth = 2;
            materialCtx.beginPath();
            materialCtx.moveTo(atom.x, atom.y);
            materialCtx.lineTo(endX, endY);
            materialCtx.stroke();
            
            // Gambar kepala panah
            materialCtx.fillStyle = "#e74c3c";
            materialCtx.beginPath();
            materialCtx.moveTo(endX, endY);
            const angle = atom.magneticMoment.angle;
            materialCtx.lineTo(
                endX - Math.cos(angle) * 8 + Math.cos(angle - Math.PI / 2) * 4,
                endY - Math.sin(angle) * 8 + Math.sin(angle - Math.PI / 2) * 4
            );
            materialCtx.lineTo(
                endX - Math.cos(angle) * 8 + Math.cos(angle + Math.PI / 2) * 4,
                endY - Math.sin(angle) * 8 + Math.sin(angle + Math.PI / 2) * 4
            );
            materialCtx.closePath();
            materialCtx.fill();
        }
    });
}

// Menggambar vektor magnetisasi total
function drawMagnetizationVector() {
    if (simulationState.magnetization > 0.01 && simulationState.externalField > 0) {
        const centerX = materialCanvas.width / 2;
        const centerY = materialCanvas.height / 2;
        
        // Hitung arah rata-rata dari semua momen
        let sumX = 0, sumY = 0;
        let count = 0;
        
        simulationState.atoms.forEach(atom => {
            if (atom.magneticMoment.visible && atom.magneticMoment.magnitude > 0.01) {
                sumX += Math.cos(atom.magneticMoment.angle) * atom.magneticMoment.magnitude;
                sumY += Math.sin(atom.magneticMoment.angle) * atom.magneticMoment.magnitude;
                count++;
            }
        });
        
        if (count > 0) {
            const avgAngle = Math.atan2(sumY / count, sumX / count);
            const vectorLength = 80 * simulationState.magnetization;
            
            // Gambar panah magnetisasi
            materialCtx.strokeStyle = "#FFD700"; // Warna emas untuk magnetisasi
            materialCtx.lineWidth = 4;
            materialCtx.beginPath();
            materialCtx.moveTo(centerX, centerY);
            materialCtx.lineTo(
                centerX + Math.cos(avgAngle) * vectorLength,
                centerY + Math.sin(avgAngle) * vectorLength
            );
            materialCtx.stroke();
            
            // Gambar kepala panah
            materialCtx.fillStyle = "#FFD700";
            materialCtx.beginPath();
            materialCtx.moveTo(
                centerX + Math.cos(avgAngle) * vectorLength,
                centerY + Math.sin(avgAngle) * vectorLength
            );
            materialCtx.lineTo(
                centerX + Math.cos(avgAngle) * (vectorLength - 12),
                centerY + Math.sin(avgAngle) * (vectorLength - 12)
            );
            materialCtx.lineTo(
                centerX + Math.cos(avgAngle) * (vectorLength - 8) + Math.cos(avgAngle - Math.PI / 2) * 6,
                centerY + Math.sin(avgAngle) * (vectorLength - 8) + Math.sin(avgAngle - Math.PI / 2) * 6
            );
            materialCtx.lineTo(
                centerX + Math.cos(avgAngle) * (vectorLength - 8) + Math.cos(avgAngle + Math.PI / 2) * 6,
                centerY + Math.sin(avgAngle) * (vectorLength - 8) + Math.sin(avgAngle + Math.PI / 2) * 6
            );
            materialCtx.closePath();
            materialCtx.fill();
            
            // Tambah label
            materialCtx.fillStyle = "#FFD700";
            materialCtx.font = "bold 14px Arial";
            materialCtx.fillText("M", 
                centerX + Math.cos(avgAngle) * (vectorLength + 20),
                centerY + Math.sin(avgAngle) * (vectorLength + 20)
            );
        }
    }
}

// Menghitung magnetisasi total
function calculateMagnetization() {
    let totalMomentX = 0;
    let totalMomentY = 0;
    let visibleCount = 0;
    
    simulationState.atoms.forEach(atom => {
        if (atom.magneticMoment.visible && atom.magneticMoment.magnitude > 0.01) {
            // Hitung komponen X dan Y dengan benar
            totalMomentX += Math.cos(atom.magneticMoment.angle) * atom.magneticMoment.magnitude;
            totalMomentY += Math.sin(atom.magneticMoment.angle) * atom.magneticMoment.magnitude;
            visibleCount++;
        }
    });
    
    if (visibleCount > 0) {
        // Magnetisasi rata-rata
        simulationState.magnetization = Math.sqrt(totalMomentX * totalMomentX + totalMomentY * totalMomentY) / visibleCount;
        
        // Arah magnetisasi (dalam radians)
        let magnetizationAngle = Math.atan2(totalMomentY, totalMomentX);
        
        // KOREKSI: Pastikan arah konsisten dengan medan
        let degrees = (magnetizationAngle * 180 / Math.PI);
        
        // Normalisasi ke 0-360
        if (degrees < 0) degrees += 360;
        
        // Update UI elements
        directionArrow.textContent = "";
        directionText.textContent = "";
        
        if (simulationState.magnetization < 0.01) {
            directionArrow.textContent = "";
            directionText.textContent = "Acak/tidak teratur";
        } else {
            // Tentukan arah utama
            if (degrees < 45 || degrees > 315) {
                directionArrow.textContent = "→";
                directionText.textContent = " Ke kanan (searah medan)";
            } else if (degrees > 135 && degrees < 225) {
                directionArrow.textContent = "←";
                directionText.textContent = " Ke kiri (berlawanan medan)";
            } else if (degrees >= 45 && degrees <= 135) {
                directionArrow.textContent = "↓";
                directionText.textContent = ` Ke bawah (${degrees.toFixed(0)}°)`;
            } else {
                directionArrow.textContent = "↑";
                directionText.textContent = ` Ke atas (${degrees.toFixed(0)}°)`;
            }
        }
    } else {
        simulationState.magnetization = 0;
        directionArrow.textContent = "";
        directionText.textContent = "Tidak ada momen magnetik";
    }
    
    // Perbarui tampilan magnetisasi
    magnetizationValue.textContent = simulationState.magnetization.toFixed(3) + " A/m";
}

// Menambahkan data ke grafik
function addGraphData() {
    const field = simulationState.externalField / 100;
    const mag = simulationState.magnetization;
    
    // Tambah titik data baru
    simulationState.graphData.push({ field, mag });
    
    // Batasi jumlah data
    if (simulationState.graphData.length > 100) {
        simulationState.graphData.shift();
    }
}

// Menggambar grafik M vs B
function drawGraph() {
    // Bersihkan canvas
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Gambar latar belakang
    graphCtx.fillStyle = "#0f0f1a";
    graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Gambar grid
    graphCtx.strokeStyle = "rgba(100, 100, 140, 0.3)";
    graphCtx.lineWidth = 1;
    
    // Grid vertikal
    for (let i = 0; i <= 10; i++) {
        const x = i * (graphCanvas.width / 10);
        graphCtx.beginPath();
        graphCtx.moveTo(x, 0);
        graphCtx.lineTo(x, graphCanvas.height);
        graphCtx.stroke();
    }
    
    // Grid horizontal
    for (let i = 0; i <= 5; i++) {
        const y = i * (graphCanvas.height / 5);
        graphCtx.beginPath();
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(graphCanvas.width, y);
        graphCtx.stroke();
    }
    
    // Gambar sumbu
    graphCtx.strokeStyle = "#4a90e2";
    graphCtx.lineWidth = 2;
    
    // Sumbu X
    graphCtx.beginPath();
    graphCtx.moveTo(30, graphCanvas.height - 30);
    graphCtx.lineTo(graphCanvas.width - 10, graphCanvas.height - 30);
    graphCtx.stroke();
    
    // Sumbu Y
    graphCtx.beginPath();
    graphCtx.moveTo(30, 10);
    graphCtx.lineTo(30, graphCanvas.height - 30);
    graphCtx.stroke();
    
    // Label sumbu
    graphCtx.fillStyle = "#a0a0c0";
    graphCtx.font = "14px Arial";
    graphCtx.textAlign = "center";
    graphCtx.fillText("Medan Magnet (B)", graphCanvas.width / 2, graphCanvas.height - 5);
    
    graphCtx.save();
    graphCtx.translate(10, graphCanvas.height / 2);
    graphCtx.rotate(-Math.PI / 2);
    graphCtx.fillText("Magnetisasi (M)", 0, 0);
    graphCtx.restore();
    
    // Gambar kurva berdasarkan material
    if (simulationState.graphData.length > 1) {
        graphCtx.strokeStyle = CONFIG[simulationState.currentMaterial].color;
        graphCtx.lineWidth = 3;
        graphCtx.beginPath();
        
        // Skala data ke canvas
        const xScale = (graphCanvas.width - 60) / 1.0; // B maks = 1.0
        const yScale = (graphCanvas.height - 60) / 1.0; // M maks = 1.0
        
        simulationState.graphData.forEach((point, index) => {
            const x = 30 + point.field * xScale;
            const y = graphCanvas.height - 30 - point.mag * yScale;
            
            if (index === 0) {
                graphCtx.moveTo(x, y);
            } else {
                graphCtx.lineTo(x, y);
            }
        });
        
        graphCtx.stroke();
        
        // Gambar titik data terbaru
        const lastPoint = simulationState.graphData[simulationState.graphData.length - 1];
        const lastX = 30 + lastPoint.field * xScale;
        const lastY = graphCanvas.height - 30 - lastPoint.mag * yScale;
        
        graphCtx.fillStyle = CONFIG[simulationState.currentMaterial].color;
        graphCtx.beginPath();
        graphCtx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
        graphCtx.fill();
        
        // Label titik
        graphCtx.fillStyle = "#e6e6e6";
        graphCtx.font = "12px Arial";
        graphCtx.textAlign = "left";
        graphCtx.fillText(`B=${lastPoint.field.toFixed(2)}, M=${lastPoint.mag.toFixed(3)}`, lastX + 10, lastY - 10);
    }
    
    // Judul grafik berdasarkan material
    let graphTitle = "";
    switch (simulationState.currentMaterial) {
        case "DIAMAGNETIC":
            graphTitle = "Kurva M vs B: Linear dengan kemiringan negatif";
            break;
        case "PARAMAGNETIC":
            graphTitle = "Kurva M vs B: Linear dengan kemiringan positif kecil";
            break;
        case "FERROMAGNETIC":
            graphTitle = "Kurva M vs B: Histeresis (non-linear)";
            break;
    }
    
    graphCtx.fillStyle = "#e6e6e6";
    graphCtx.font = "bold 16px Arial";
    graphCtx.textAlign = "center";
    graphCtx.fillText(graphTitle, graphCanvas.width / 2, 25);
}

// Memperbarui informasi material
function updateMaterialInfo() {
    const material = CONFIG[simulationState.currentMaterial];
    
    currentMaterialElement.textContent = material.name;
    materialDescription.textContent = material.description;
    susceptibilityValue.textContent = material.susceptibility;
    materialProperty.textContent = material.property;
    
    // Perbarui warna teks material aktif
    activeMaterialName.textContent = material.name;
    activeMaterialName.className = `${simulationState.currentMaterial.toLowerCase()}-text`;
    
    // Perbarui panel kontrol suhu (hanya untuk paramagnetik)
    if (simulationState.currentMaterial === "PARAMAGNETIC") {
        tempControl.style.display = "block";
    } else {
        tempControl.style.display = "none";
    }
    
    // Perbarui warna tombol aktif
    document.querySelectorAll('.material-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${simulationState.currentMaterial.toLowerCase()}-btn`).classList.add('active');
}

// Menyiapkan event listener
function setupEventListeners() {
    // Tombol material
    document.getElementById('diamagnetic-btn').addEventListener('click', () => {
        simulationState.currentMaterial = "DIAMAGNETIC";
        createDomains();
        updateMaterialInfo();
        drawSimulation();
        drawGraph();
    });
    
    document.getElementById('paramagnetic-btn').addEventListener('click', () => {
        simulationState.currentMaterial = "PARAMAGNETIC";
        createDomains();
        updateMaterialInfo();
        drawSimulation();
        drawGraph();
    });
    
    document.getElementById('ferromagnetic-btn').addEventListener('click', () => {
        simulationState.currentMaterial = "FERROMAGNETIC";
        createDomains();
        updateMaterialInfo();
        drawSimulation();
        drawGraph();
    });
    
    // Slider medan magnet
    fieldSlider.addEventListener('input', () => {
        simulationState.externalField = parseInt(fieldSlider.value);
        fieldValue.textContent = (simulationState.externalField / 100).toFixed(2);
        drawSimulation();
        drawGraph();
    });
    
    // Tombol kontrol medan magnet
    document.getElementById('increase-field').addEventListener('click', () => {
        let newValue = Math.min(100, simulationState.externalField + 10);
        fieldSlider.value = newValue;
        simulationState.externalField = newValue;
        fieldValue.textContent = (newValue / 100).toFixed(2);
        drawSimulation();
        drawGraph();
    });
    
    document.getElementById('decrease-field').addEventListener('click', () => {
        let newValue = Math.max(0, simulationState.externalField - 10);
        fieldSlider.value = newValue;
        simulationState.externalField = newValue;
        fieldValue.textContent = (newValue / 100).toFixed(2);
        drawSimulation();
        drawGraph();
    });
    
    document.getElementById('zero-field').addEventListener('click', () => {
        fieldSlider.value = 0;
        simulationState.externalField = 0;
        fieldValue.textContent = "0.00";
        drawSimulation();
        drawGraph();
    });
    
    // Slider suhu (hanya untuk paramagnetik)
    tempSlider.addEventListener('input', () => {
        simulationState.temperature = parseInt(tempSlider.value);
        tempValue.textContent = simulationState.temperature;
        
        if (simulationState.currentMaterial === "PARAMAGNETIC") {
            drawSimulation();
            drawGraph();
        }
    });
    
    // Tombol reset
    document.getElementById('reset-btn').addEventListener('click', () => {
        simulationState.externalField = 0;
        simulationState.temperature = 300;
        simulationState.graphData = [];
        
        fieldSlider.value = 0;
        tempSlider.value = 300;
        
        fieldValue.textContent = "0.00";
        tempValue.textContent = "300";
        
        createAtoms();
        createDomains();
        drawSimulation();
        drawGraph();
    });
    
    // Animasi simulasi
    function animate() {
        drawSimulation();
        drawGraph();
        simulationState.animationId = requestAnimationFrame(animate);
    }
    
    // Mulai animasi
    animate();
}

// Inisialisasi saat halaman dimuat
window.addEventListener('load', initSimulation);