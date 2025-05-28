
// ESSYTEL Main JavaScript - Landing Page 3D Scene and Interactions

let scene, camera, renderer, table, menuItems = [];
let isAnimating = false;

// Initialize 3D Scene
function init3DScene() {
    const container = document.getElementById('hero-scene');
    if (!container) return;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF7F4F4);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create dining table
    createDiningTable();

    // Create floating menu items
    createMenuItems();

    // Add subtle rotation
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createDiningTable() {
    // Table top
    const tableGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = 0;
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);

    // Table leg
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.y = -1;
    leg.castShadow = true;
    scene.add(leg);

    // Add some table setting
    addTableSetting();
}

function addTableSetting() {
    // Plate
    const plateGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32);
    const plateMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.set(1, 0.15, 0);
    plate.castShadow = true;
    scene.add(plate);

    // Wine glass
    const glassGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const glassMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x552834, 
        transparent: true, 
        opacity: 0.7 
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(-1, 0.5, 0.5);
    glass.castShadow = true;
    scene.add(glass);
}

function createMenuItems() {
    const menuData = [
        { name: 'Pizza', color: 0xFF6B6B, position: [-2, 2, 1] },
        { name: 'Salad', color: 0x4ECDC4, position: [2, 2.5, -1] },
        { name: 'Wine', color: 0x552834, position: [0, 3, 2] }
    ];

    menuData.forEach((item, index) => {
        const geometry = new THREE.SphereGeometry(0.4, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: item.color });
        const menuItem = new THREE.Mesh(geometry, material);
        
        menuItem.position.set(...item.position);
        menuItem.castShadow = true;
        menuItem.userData = { name: item.name, originalY: item.position[1] };
        
        menuItems.push(menuItem);
        scene.add(menuItem);
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate table slowly
    if (table) {
        table.rotation.y += 0.002;
    }

    // Float menu items
    menuItems.forEach((item, index) => {
        const time = Date.now() * 0.001;
        item.position.y = item.userData.originalY + Math.sin(time + index) * 0.3;
        item.rotation.x += 0.01;
        item.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('hero-scene');
    if (!container) return;

    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

// Start ordering animation and navigation
function startOrdering() {
    if (isAnimating) return;
    
    isAnimating = true;
    console.log('Starting order process...');
    
    // Add visual feedback
    const button = event.target;
    button.style.transform = 'scale(1.1)';
    button.style.transition = 'all 0.3s ease';
    
    // Animate menu items
    menuItems.forEach((item, index) => {
        setTimeout(() => {
            item.position.y += 2;
            item.rotation.x += Math.PI;
        }, index * 200);
    });

    // Show polite message
    showPoliteMessage("Wonderful! Let me take you to our delicious menu. 🍽️");
    
    // Navigate after animation
    setTimeout(() => {
        window.location.href = 'order.html';
    }, 1500);
}

// Polite AI message system
function showPoliteMessage(message) {
    // Create or update AI response element
    let aiElement = document.querySelector('.ai-response');
    if (!aiElement) {
        aiElement = document.createElement('div');
        aiElement.className = 'ai-response';
        aiElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(85, 40, 52, 0.2);
            border: 1px solid rgba(85, 40, 52, 0.1);
            max-width: 300px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(aiElement);
    }

    aiElement.innerHTML = `
        <div class="ai-message">
            <span class="ai-icon">🤖</span>
            <p>${message}</p>
        </div>
    `;

    // Animate in
    setTimeout(() => {
        aiElement.style.transform = 'translateX(0)';
    }, 100);

    // Auto hide after 3 seconds
    setTimeout(() => {
        aiElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (aiElement.parentNode) {
                aiElement.parentNode.removeChild(aiElement);
            }
        }, 300);
    }, 3000);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('ESSYTEL Landing Page Loaded');
    
    // Initialize 3D scene
    setTimeout(init3DScene, 100);
    
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add parallax effect to hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        const sceneContainer = document.querySelector('.scene-container');
        
        if (heroContent && sceneContainer) {
            heroContent.style.transform = `translateY(${scrolled * 0.1}px)`;
            sceneContainer.style.transform = `translateY(${scrolled * 0.2}px)`;
        }
    });

    // Welcome message after page load
    setTimeout(() => {
        showPoliteMessage("Welcome to ESSYTEL! Ready to experience the future of dining? 🍽️✨");
    }, 2000);
});

// Global functions for buttons
window.startOrdering = startOrdering;