import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { RoomsService, Classroom, SchoolMap } from '../services/rooms.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as THREE from 'three';
// Try changing your import to:
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
// (Note the .js extension at the end, which is often required in modern build tools)
@Component({
  selector: 'app-rooms-management-component',
  imports: [FormsModule,CommonModule],
  templateUrl: './rooms-management-component.component.html',
  styleUrl: './rooms-management-component.component.css'
})
export class RoomsManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('gameCanvas') gameCanvasRef!: ElementRef;
  
  // البيانات
  rooms: Classroom[] = [];
  selectedRoom: Classroom | null = null;
  schoolMap: SchoolMap | null = null;
  filteredRooms: Classroom[] = [];
  
  // حالة التطبيق
  isAddingRoom = false;
  isEditingRoom = false;
  isLoading = true;
  viewMode: 'list' | 'grid' | '3d' = '3d';
  currentFloor = 1;
  currentBuilding = 'Main';
  zoomLevel = 1;
  
  // نموذج الغرفة الجديدة
  newRoom: any = {
    name: '',
    capacity: 30,
    floor: 1,
    building: 'Main',
    location: '',
    color: '#3498db',
    equipment: [],
    status: 'available'
  };
  
  // إحصائيات
  statistics = {
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalCapacity: 0
  };
  
  // Three.js المتغيرات
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private roomObjects: THREE.Group[] = [];
  
  // عوامل التصفية
  filter = {
    floor: '',
    building: '',
    status: '',
    capacity: ''
  };
  
  // جدول زمني
  scheduleData: any[] = [];
  
  constructor(private roomsService: RoomsService) {}
  
  ngOnInit(): void {
    this.loadData();
    this.setupKeyboardControls();
  }
  
  ngAfterViewInit(): void {
    if (this.viewMode === '3d') {
      this.init3DView();
    }
  }
  
  // تحميل البيانات
  loadData(): void {
    this.isLoading = true;
    forkJoin({
      rooms: this.roomsService.getRooms(),
      map: this.roomsService.getSchoolMap(),
      stats: this.roomsService.getRoomStatistics()
    }).subscribe({
      next: (results) => {
        this.rooms = results.rooms;
        this.filteredRooms = [...this.rooms];
        this.schoolMap = results.map;
        this.statistics = results.stats;
        this.isLoading = false;
        
        if (this.viewMode === '3d') {
          this.create3DScene();
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    });
  }
  
  // تهيئة عرض 3D
  init3DView(): void {
    const canvas = this.gameCanvasRef.nativeElement;
    
    // إنشاء المشهد
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // لون سماوي
    
    // إنشاء الكاميرا
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(50, 50, 50);
    
    // إنشاء المحرك
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true 
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // إضافة التحكم
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // إضافة الإضاءة
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    this.scene.add(directionalLight);
    
    // إضافة الأرضية
    this.createFloor();
    
    // إنشاء الغرف
    this.create3DScene();
    
    // البدء بالتصيير
    this.animate();
  }
  
  // إنشاء المشهد ثلاثي الأبعاد
  create3DScene(): void {
    if (!this.scene || !this.rooms.length) return;
    
    // مسح الغرف السابقة
    this.roomObjects.forEach(room => this.scene.remove(room));
    this.roomObjects = [];
    
    // إنشاء مبنى متعدد الطوابق
    const buildingWidth = 100;
    const buildingDepth = 60;
    const floorHeight = 15;
    
    // إنشاء المبنى الأساسي
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, 5, buildingDepth);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x95a5a6,
      transparent: true,
      opacity: 0.8
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 2.5;
    this.scene.add(building);
    
    // إنشاء الطوابق
    const floors = this.schoolMap?.floors || [1, 2, 3];
    floors.forEach(floorNum => {
      // إنشاء أرضية الطابق
      const floorGeometry = new THREE.PlaneGeometry(buildingWidth - 10, buildingDepth - 10);
      const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xecf0f1,
        side: THREE.DoubleSide
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = Math.PI / 2;
      floor.position.y = floorNum * floorHeight;
      this.scene.add(floor);
      
      // إضافة علامة الطابق
      this.addFloorLabel(floorNum, buildingWidth);
      
      // إنشاء الغرف في هذا الطابق
      const floorRooms = this.rooms.filter(room => room.floor === floorNum);
      this.createFloorRooms(floorRooms, floorNum, floorHeight);
    });
    
    // إضافة السلالم
    this.addStairs(buildingWidth, buildingDepth, floors.length, floorHeight);
    
    // إضافة الزينة الخارجية
    this.addExteriorDecorations(buildingWidth, buildingDepth);
  }
  
  // إنشاء الغرف في الطابق
  createFloorRooms(rooms: Classroom[], floorNum: number, floorHeight: number): void {
    const roomsPerRow = 4;
    const roomWidth = 18;
    const roomDepth = 12;
    const corridorWidth = 8;
    
    rooms.forEach((room, index) => {
      const row = Math.floor(index / roomsPerRow);
      const col = index % roomsPerRow;
      
      const x = (col - (roomsPerRow - 1) / 2) * (roomWidth + 5);
      const z = row * (roomDepth + corridorWidth);
      
      // إنشاء الغرفة ثلاثية الأبعاد
      const roomGroup = this.create3DRoom(room, x, floorNum * floorHeight, z);
      this.roomObjects.push(roomGroup);
      this.scene.add(roomGroup);
      
      // إضافة التفاعل
      this.addRoomInteraction(roomGroup, room);
    });
  }
  
  // إنشاء غرفة ثلاثية الأبعاد
  create3DRoom(room: Classroom, x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y + 2, z);
    group.userData = { roomId: room._id, roomData: room };
    
    // إنشاء جدران الغرفة
    const roomWidth = 18;
    const roomHeight = 10;
    const roomDepth = 12;
    const wallThickness = 0.5;
    
    // تحديد لون الغرفة حسب حالتها
    let wallColor: number;
    switch(room.status) {
      case 'available': wallColor = 0x2ecc71; break; // أخضر
      case 'occupied': wallColor = 0xe74c3c; break; // أحمر
      case 'maintenance': wallColor = 0xf39c12; break; // برتقالي
      default: wallColor = 0x3498db; // أزرق
    }
    
    // الجدار الأمامي
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
      new THREE.MeshPhongMaterial({ color: wallColor })
    );
    frontWall.position.z = -roomDepth / 2;
    group.add(frontWall);
    
    // الجدار الخلفي
    const backWall = frontWall.clone();
    backWall.position.z = roomDepth / 2;
    group.add(backWall);
    
    // الجدار الأيمن
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
      new THREE.MeshPhongMaterial({ color: wallColor })
    );
    rightWall.position.x = roomWidth / 2;
    group.add(rightWall);
    
    // الجدار الأيسر
    const leftWall = rightWall.clone();
    leftWall.position.x = -roomWidth / 2;
    group.add(leftWall);
    
    // السقف
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, wallThickness, roomDepth),
      new THREE.MeshPhongMaterial({ color: 0x7f8c8d })
    );
    ceiling.position.y = roomHeight / 2;
    group.add(ceiling);
    
    // الأرضية
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth - 1, wallThickness, roomDepth - 1),
      new THREE.MeshPhongMaterial({ color: 0x34495e })
    );
    floor.position.y = -roomHeight / 2;
    group.add(floor);
    
    // الباب
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 0.2),
      new THREE.MeshPhongMaterial({ color: 0x8b4513 })
    );
    door.position.set(0, -2, -roomDepth / 2);
    group.add(door);
    
    // النوافذ
    for (let i = 0; i < 2; i++) {
      const window = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 0.1),
        new THREE.MeshPhongMaterial({ 
          color: 0x87CEEB,
          transparent: true,
          opacity: 0.6 
        })
      );
      window.position.set(i * 6 - 3, 2, -roomDepth / 2);
      group.add(window);
    }
    
    // إضافة اسم الغرفة فوق الباب
    this.addRoomLabel(group, room.name, roomWidth);
    
    // إضافة المقاعد داخل الغرفة
    this.addFurniture(group, room);
    
    return group;
  }
  
  // إضافة أثاث الغرفة
  addFurniture(group: THREE.Group, room: Classroom): void {
    const seatCount = Math.min(room.capacity, 30);
    const rows = 5;
    const cols = Math.ceil(seatCount / rows);
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r * cols + c >= seatCount) break;
        
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1, 1.5),
          new THREE.MeshPhongMaterial({ color: 0x2c3e50 })
        );
        seat.position.set(
          c * 2 - (cols - 1),
          -4.5,
          r * 2 - (rows - 1)
        );
        group.add(seat);
        
        // ظهر الكرسي
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 2, 0.2),
          new THREE.MeshPhongMaterial({ color: 0x34495e })
        );
        back.position.set(
          c * 2 - (cols - 1),
          -3,
          r * 2 - (rows - 1) - 0.8
        );
        group.add(back);
      }
    }
    
    // السبورة
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x000000 })
    );
    board.position.set(0, 0, 5);
    group.add(board);
    
    // إطار السبورة
    const boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 4.2, 0.2),
      new THREE.MeshPhongMaterial({ color: 0xc0392b })
    );
    boardFrame.position.set(0, 0, 5.1);
    group.add(boardFrame);
  }
  
  // إضافة اسم الغرفة
  addRoomLabel(group: THREE.Group, roomName: string, roomWidth: number): void {
    // إنشاء نص SVG (يمكن استبداله بنص ثلاثي الأبعاد حقيقي)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 512;
    canvas.height = 256;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = 'bold 60px Arial';
    context.textAlign = 'center';
    context.fillText(roomName, canvas.width / 2, canvas.height / 2 + 20);
    
    const texture = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth - 2, 2),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    label.position.set(0, 5, -7);
    label.rotation.y = Math.PI;
    group.add(label);
  }
  
  // إضافة علامة الطابق
  addFloorLabel(floorNum: number, buildingWidth: number): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#2c3e50';
    context.font = 'bold 40px Arial';
    context.textAlign = 'center';
    context.fillText(`الطابق ${floorNum}`, canvas.width / 2, canvas.height / 2 + 20);
    
    const texture = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    label.position.set(-buildingWidth / 2 + 5, floorNum * 15, 0);
    this.scene.add(label);
  }
  
  // إضافة السلالم
  addStairs(buildingWidth: number, buildingDepth: number, floors: number, floorHeight: number): void {
    const stairWidth = 5;
    const stairDepth = 10;
    
    for (let i = 0; i < floors - 1; i++) {
      const stairs = new THREE.Group();
      
      for (let step = 0; step < 10; step++) {
        const stair = new THREE.Mesh(
          new THREE.BoxGeometry(stairWidth, floorHeight / 10, stairDepth),
          new THREE.MeshPhongMaterial({ color: 0x7d3c98 })
        );
        stair.position.set(
          buildingWidth / 2 + 2,
          (i * floorHeight) + (step * floorHeight / 10),
          step - 5
        );
        stairs.add(stair);
      }
      
      this.scene.add(stairs);
    }
  }
  
  // إضافة زينة خارجية
  addExteriorDecorations(buildingWidth: number, buildingDepth: number): void {
    // الأشجار
    for (let i = 0; i < 5; i++) {
      const tree = this.createTree();
      tree.position.set(
        (Math.random() - 0.5) * (buildingWidth + 50),
        0,
        (Math.random() - 0.5) * (buildingDepth + 50)
      );
      this.scene.add(tree);
    }
    
    // مواقف السيارات
    const parkingSpots = 10;
    for (let i = 0; i < parkingSpots; i++) {
      const spot = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 8),
        new THREE.MeshPhongMaterial({ color: 0x2c3e50 })
      );
      spot.position.set(
        -buildingWidth / 2 - 10 + (i % 5) * 5,
        0.05,
        buildingDepth / 2 + 10 + Math.floor(i / 5) * 10
      );
      this.scene.add(spot);
      
      // سيارة
      if (Math.random() > 0.5) {
        const car = this.createCar();
        car.position.copy(spot.position);
        car.position.y = 1;
        this.scene.add(car);
      }
    }
  }
  
  // إنشاء شجرة
  createTree(): THREE.Group {
    const tree = new THREE.Group();
    
    // الجذع
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 5),
      new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );
    tree.add(trunk);
    
    // الأوراق
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x27ae60 })
    );
    leaves.position.y = 4;
    tree.add(leaves);
    
    return tree;
  }
  
  // إنشاء سيارة
  createCar(): THREE.Group {
    const car = new THREE.Group();
    
    // هيكل السيارة
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 6),
      new THREE.MeshPhongMaterial({ color: 0xc0392b })
    );
    car.add(body);
    
    // النوافذ
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.8, 1),
      new THREE.MeshPhongMaterial({ color: 0x3498db, transparent: true, opacity: 0.5 })
    );
    window.position.y = 0.6;
    window.position.z = -1.5;
    car.add(window);
    
    // العجلات
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    
    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(
        i < 2 ? -1.2 : 1.2,
        -0.6,
        i % 2 ? -2 : 2
      );
      car.add(wheel);
    }
    
    return car;
  }
  
  // إضافة التفاعل مع الغرف
  addRoomInteraction(roomGroup: THREE.Group, room: Classroom): void {
    // جعل الغرفة قابلة للنقر
    roomGroup.userData = { ...roomGroup.userData, onClick: () => this.selectRoom(room) };
  }
  
  // إنشاء الأرضية
  createFloor(): void {
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorTexture = new THREE.TextureLoader().load('assets/textures/floor.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      map: floorTexture,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // إضافة شبكة لتسهيل التوجيه
    const gridHelper = new THREE.GridHelper(200, 50, 0x000000, 0x000000);
    this.scene.add(gridHelper);
  }
  
  // دورة التصيير
  animate(): void {
    requestAnimationFrame(() => this.animate());
    
    if (this.controls) {
      this.controls.update();
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    
    // تدوير الغرف قليلاً لتأثير حيوي
    this.roomObjects.forEach(room => {
      room.rotation.y += 0.001;
    });
  }
  
  // تغيير وضع العرض
  changeViewMode(mode: 'list' | 'grid' | '3d'): void {
    this.viewMode = mode;
    if (mode === '3d' && !this.renderer) {
      setTimeout(() => this.init3DView(), 100);
    }
  }
  
  // تغيير الطابق
  changeFloor(direction: number): void {
    const floors = this.schoolMap?.floors || [1, 2, 3];
    const currentIndex = floors.indexOf(this.currentFloor);
    const newIndex = (currentIndex + direction + floors.length) % floors.length;
    this.currentFloor = floors[newIndex];
    
    if (this.viewMode === '3d') {
      this.camera.position.y = this.currentFloor * 15 + 20;
      this.controls.target.y = this.currentFloor * 15;
    }
    
    this.filterRooms();
  }
  
  // تصفية الغرف
  filterRooms(): void {
    this.filteredRooms = this.rooms.filter(room => {
      if (this.filter.floor && room.floor !== parseInt(this.filter.floor)) return false;
      if (this.filter.building && room.building !== this.filter.building) return false;
      if (this.filter.status && room.status !== this.filter.status) return false;
      if (this.filter.capacity && room.capacity < parseInt(this.filter.capacity)) return false;
      if (this.currentFloor && room.floor !== this.currentFloor) return false;
      return true;
    });
  }
  
  // إضافة غرفة جديدة
  addRoom(): void {
    this.isAddingRoom = true;
    this.newRoom = {
      name: '',
      capacity: 30,
      floor: this.currentFloor,
      building: this.currentBuilding,
      location: '',
      color: '#3498db',
      equipment: [],
      status: 'available'
    };
  }
  
  // حفظ الغرفة الجديدة
  saveNewRoom(): void {
    if (!this.newRoom.name) {
      alert('الرجاء إدخال اسم الغرفة');
      return;
    }
    
    this.roomsService.createRoom(this.newRoom).subscribe({
      next: (room) => {
        this.rooms.push(room);
        this.filterRooms();
        this.isAddingRoom = false;
        
        // إذا كنا في وضع 3D، نضيف الغرفة الجديدة
        if (this.viewMode === '3d') {
          this.create3DScene();
        }
      },
      error: (error) => {
        console.error('Error adding room:', error);
        alert('حدث خطأ أثناء إضافة الغرفة');
      }
    });
  }
  
  // تعديل غرفة
  editRoom(room: Classroom): void {
    this.selectedRoom = room;
    this.isEditingRoom = true;
    this.newRoom = { ...room };
  }
  
  // حفظ التعديلات
  saveRoomEdit(): void {
    if (!this.selectedRoom) return;
    
    this.roomsService.updateRoom(this.selectedRoom._id, this.newRoom).subscribe({
      next: (updatedRoom) => {
        const index = this.rooms.findIndex(r => r._id === updatedRoom._id);
        if (index !== -1) {
          this.rooms[index] = updatedRoom;
        }
        this.selectedRoom = updatedRoom;
        this.isEditingRoom = false;
        
        if (this.viewMode === '3d') {
          this.create3DScene();
        }
      },
      error: (error) => {
        console.error('Error updating room:', error);
        alert('حدث خطأ أثناء تعديل الغرفة');
      }
    });
  }
  
  // حذف غرفة
  deleteRoom(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة؟')) {
      this.roomsService.deleteRoom(id).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(room => room._id !== id);
          this.filterRooms();
          this.selectedRoom = null;
          
          if (this.viewMode === '3d') {
            this.create3DScene();
          }
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          alert('حدث خطأ أثناء حذف الغرفة');
        }
      });
    }
  }
  
  // اختيار غرفة
  selectRoom(room: Classroom): void {
    this.selectedRoom = room;
    
    // تحميل جدول الغرفة
    this.roomsService.getRoomSchedule(room._id).subscribe({
      next: (schedule) => {
        this.scheduleData = schedule;
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
      }
    });
    
    // إذا كنا في وضع 3D، نقرب الكاميرا إلى الغرفة
    if (this.viewMode === '3d') {
      const roomGroup = this.roomObjects.find(r => r.userData['roomId'] === room._id);      if (roomGroup) {
        this.controls.target.copy(roomGroup.position);
        this.camera.position.copy(roomGroup.position).add(new THREE.Vector3(20, 20, 20));
      }
    }
  }
  
  // تغيير حالة الغرفة
  changeStatus(roomId: string, status: 'available' | 'occupied' | 'maintenance'): void {
    this.roomsService.changeRoomStatus(roomId, status).subscribe({
      next: (updatedRoom) => {
        const index = this.rooms.findIndex(r => r._id === updatedRoom._id);
        if (index !== -1) {
          this.rooms[index] = updatedRoom;
        }
        
        if (this.selectedRoom?._id === updatedRoom._id) {
          this.selectedRoom = updatedRoom;
        }
        
        if (this.viewMode === '3d') {
          this.create3DScene();
        }
      },
      error: (error) => {
        console.error('Error changing room status:', error);
      }
    });
  }
  
  // التحكم بلوحة المفاتيح
  setupKeyboardControls(): void {
    // سيتم تنفيذها في الأحداث
  }
  
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.viewMode !== '3d') return;
    
    switch(event.key) {
      case 'ArrowUp':
        this.changeFloor(1);
        break;
      case 'ArrowDown':
        this.changeFloor(-1);
        break;
      case '+':
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
        this.camera.zoom = this.zoomLevel;
        this.camera.updateProjectionMatrix();
        break;
      case '-':
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        this.camera.zoom = this.zoomLevel;
        this.camera.updateProjectionMatrix();
        break;
      case 'r':
      case 'R':
        this.camera.position.set(50, 50, 50);
        this.controls.target.set(0, 0, 0);
        break;
    }
  }
  
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.camera && this.renderer) {
      const canvas = this.gameCanvasRef.nativeElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
  }
  
  // التكبير والتصغير
  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
    if (this.camera) {
      this.camera.zoom = this.zoomLevel;
      this.camera.updateProjectionMatrix();
    }
  }
  
  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
    if (this.camera) {
      this.camera.zoom = this.zoomLevel;
      this.camera.updateProjectionMatrix();
    }
  }
  
  // إعادة تعيين العرض
  resetView(): void {
    if (this.camera && this.controls) {
      this.camera.position.set(50, 50, 50);
      this.controls.target.set(0, 0, 0);
      this.zoomLevel = 1;
      this.camera.zoom = this.zoomLevel;
      this.camera.updateProjectionMatrix();
    }
  }




  // وظائف مساعدة للحالة
// في RoomsManagementComponent class
getStatusIcon(status: string): string {
  switch(status) {
    case 'available': return 'fas fa-check-circle';
    case 'occupied': return 'fas fa-users';
    case 'maintenance': return 'fas fa-tools';
    default: return 'fas fa-question-circle';
  }
}

getStatusText(status: string): string {
  switch(status) {
    case 'available': return 'متاحة';
    case 'occupied': return 'مشغولة';
    case 'maintenance': return 'قيد الصيانة';
    default: return 'غير معروف';
  }
}

getNextStatus(currentStatus: string): 'available' | 'occupied' | 'maintenance' {
  switch(currentStatus) {
    case 'available': return 'occupied';
    case 'occupied': return 'maintenance';
    case 'maintenance': return 'available';
    default: return 'available';
  }
}

toggleEquipment(item: string): void {
  const index = this.newRoom.equipment.indexOf(item);
  if (index > -1) {
    this.newRoom.equipment.splice(index, 1);
  } else {
    this.newRoom.equipment.push(item);
  }
}

}