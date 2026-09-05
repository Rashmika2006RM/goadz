// go PAGEZ Shared Application Script

// Theme Manager: Dark & Light mode toggle
function initTheme() {
    const savedTheme = localStorage.getItem('goPagezTheme') || localStorage.getItem('cpTheme') || 'light';
    applyTheme(savedTheme);

    const toggleBtns = document.querySelectorAll('#darkModeToggle, .theme-toggle-btn, [data-toggle="theme"]');
    toggleBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        };
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('goPagezTheme', theme);
    localStorage.setItem('cpTheme', theme);

    // Update icons
    const icons = document.querySelectorAll('#themeIcon, .theme-toggle-icon');
    icons.forEach(icon => {
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
            if (icon.parentElement) icon.parentElement.setAttribute('title', 'Switch to Light Mode');
        } else {
            icon.className = 'fa-solid fa-moon';
            if (icon.parentElement) icon.parentElement.setAttribute('title', 'Switch to Dark Mode');
        }
    });
}

// Auto-run theme immediately
initTheme();
applySiteCustomizations();

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDB();
    applySiteCustomizations();
    initNavbarAuth();
    initSubcategories();
    initPostAdForm();
    loadPublishedAds();
    renderBannerAds();
    loadAdDetails();
});

// Subcategories mapping dictionary
const subcategoriesData = {
    cars: ['Cars', 'Motorbikes & Scooters', 'Vans & Three-Wheelers', 'Busses & Heavy Vehicles', 'Auto Parts & Accessories', 'Boats & Watercraft'],
    property: ['Land For Sale', 'Houses For Sale', 'Apartments For Sale', 'Houses For Rent', 'Commercial Property', 'Short Term & Holiday Lets'],
    electronics: ['Laptops & Computers', 'TVs, Audio & Video', 'Cameras & Camcorders', 'Home & Kitchen Appliances', 'Video Games & Consoles', 'Computer Accessories'],
    jobs: ['IT & Software Development', 'Sales & Telemarketing', 'Driver & Transport', 'Accounting & Finance', 'Hotel & Tourism', 'Cleaning & Domestic Work'],
    mobile: ['Mobile Phones', 'Tablets', 'Smartwatches & Fitness Trackers', 'Mobile Accessories', 'VIP Phone Numbers & SIMs'],
    fashion: ['Clothing & Apparel', 'Shoes & Footwear', 'Watches & Accessories', 'Jewelry & Cosmetics', 'Bags & Luggage'],
    pets: ['Dogs & Puppies', 'Cats & Kittens', 'Birds', 'Fish & Aquariums', 'Pet Food & Accessories'],
    services: ['Home Services', 'Domestic Help', 'Vehicle Services', 'Education & Classes', 'Event Services', 'Financial Services'],
    home: ['Furniture', 'Kitchen & Dining', 'Home Decor', 'Garden & Outdoor', 'Lighting']
};

// Function to handle dynamic subcategory population
function initSubcategories() {
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');

    if (!categorySelect || !subcategorySelect) return;

    categorySelect.addEventListener('change', function() {
        const catVal = this.value;
        const subList = subcategoriesData[catVal] || [];

        subcategorySelect.innerHTML = '<option value="" selected disabled>Select Subcategory</option>';
        subList.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.toLowerCase().replace(/[^a-z0-9]/g, '-');
            opt.textContent = sub;
            subcategorySelect.appendChild(opt);
        });
        subcategorySelect.disabled = false;
    });
}

// ================================================
// INDEXED-DB UNLIMITED MEDIA STORAGE ENGINE
// ================================================
const IDB_NAME = 'goPagezMediaDB';
const IDB_STORE = 'mediaStore';

function openMediaDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

async function getMediaItem(key) {
    try {
        const db = await openMediaDB();
        return new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    } catch(e) {
        return null;
    }
}

// Ultra-efficient image compression helper (~30KB per photo)
function compressImage(file, maxDim = 720, quality = 0.62, callback) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                else       { w = Math.round(w * maxDim / h); h = maxDim; }
            }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            callback(c.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Function to handle posting a new ad from post-ad.html
function initPostAdForm() {
    const postForm = document.getElementById('postAdForm');
    const imageInput = document.getElementById('imageUpload');
    const previewContainer = document.getElementById('imagePreview');
    let uploadedImages = [];

    if (imageInput && previewContainer) {
        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files).slice(0, 10); // Max 10 photos
            if (files.length > 0) {
                uploadedImages = [];
                previewContainer.innerHTML = '';
                
                files.forEach((file, index) => {
                    compressImage(file, 800, 0.72, function(compressedDataUrl) {
                        uploadedImages[index] = compressedDataUrl;
                        
                        // Render thumbnail preview
                        const col = document.createElement('div');
                        col.className = 'col position-relative';
                        col.innerHTML = `
                            <div class="card h-100 border-0 shadow-sm overflow-hidden rounded">
                                <img src="${compressedDataUrl}" class="card-img-top" style="height: 90px; object-fit: cover;">
                                ${index === 0 ? '<span class="badge bg-primary position-absolute top-0 start-0 m-1" style="font-size:10px;">Primary</span>' : ''}
                            </div>
                        `;
                        previewContainer.appendChild(col);
                    });
                });
            }
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const title = document.getElementById('adTitle')?.value.trim() || 'Untitled Listing';
            const priceVal = document.getElementById('price')?.value.trim() || '0';
            const categorySelect = document.getElementById('category');
            const categoryText = categorySelect ? categorySelect.options[categorySelect.selectedIndex]?.text : 'General';
            const categoryVal = categorySelect ? categorySelect.value : 'cars';

            const subcategorySelect = document.getElementById('subcategory');
            const subcategoryText = (subcategorySelect && subcategorySelect.selectedIndex > 0) ? subcategorySelect.options[subcategorySelect.selectedIndex].text : '';

            const city = document.getElementById('city')?.value.trim() || '';
            const district = document.getElementById('district')?.value || 'Colombo';
            const description = document.getElementById('description')?.value.trim() || '';
            const isFeatured = document.getElementById('pkgFeatured')?.checked;

            // Seller Info
            const sellerName = document.getElementById('sellerName')?.value.trim() || 'Kasun Perera';
            const sellerPhone = document.getElementById('sellerPhone')?.value.trim() || '077 123 4567';
            const sellerEmail = document.getElementById('sellerEmail')?.value.trim() || 'seller@example.com';
            const sellerWhatsapp = document.getElementById('sellerWhatsapp')?.value.trim() || sellerPhone;
            const hidePhone = document.getElementById('hidePhone')?.checked || false;

            // Default image fallback by category if no image uploaded
            let defaultImage = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80';
            if (categoryVal === 'cars') {
                defaultImage = 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=600&q=80';
            } else if (categoryVal === 'property') {
                defaultImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80';
            } else if (categoryVal === 'mobile') {
                defaultImage = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80';
            } else if (categoryVal === 'electronics') {
                defaultImage = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80';
            }

            const formattedPrice = isNaN(priceVal) ? priceVal : ('Rs. ' + Number(priceVal).toLocaleString());
            const locationStr = city ? `${city}, ${district}` : district;

            const finalImages = (uploadedImages.length > 0) ? uploadedImages.filter(Boolean) : [defaultImage];

            const newAd = {
                id: 'ad_' + Date.now(),
                title: title,
                price: formattedPrice,
                category: categoryText,
                subcategory: subcategoryText,
                categoryKey: categoryVal,
                location: locationStr,
                image: finalImages[0],
                images: finalImages,
                description: description,
                sellerName: sellerName,
                sellerPhone: sellerPhone,
                sellerEmail: sellerEmail,
                sellerWhatsapp: sellerWhatsapp,
                hidePhone: hidePhone,
                package: isFeatured ? 'featured' : 'free',
                postedTime: 'Just now'
            };

            // Save to publishedAds array
            const existingAds = JSON.parse(localStorage.getItem('publishedAds') || '[]');
            existingAds.unshift(newAd);
            localStorage.setItem('publishedAds', JSON.stringify(existingAds));

            // Sync to classifiedDB for Admin Panel
            let db = JSON.parse(localStorage.getItem('classifiedDB') || '{"ads":[],"banners":[],"users":[],"categories":[],"bookings":[]}');
            if (!db.ads) db.ads = [];
            db.ads.push({
                id: newAd.id,
                title: newAd.title,
                category: newAd.category + (newAd.subcategory ? ` > ${newAd.subcategory}` : ''),
                price: newAd.price,
                contact: newAd.sellerPhone,
                sellerName: newAd.sellerName,
                sellerPhone: newAd.sellerPhone,
                sellerEmail: newAd.sellerEmail,
                sellerWhatsapp: newAd.sellerWhatsapp,
                description: newAd.description,
                image: newAd.image,
                images: newAd.images,
                status: 'Approved'
            });

            if (!db.bookings) db.bookings = [];
            const todayStr = new Date().toISOString().split('T')[0];
            const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const priceNum = Number(String(priceVal).replace(/[^0-9]/g, '')) || 0;

            db.bookings.push({
                id: Date.now(),
                adId: newAd.id,
                client: newAd.sellerName,
                title: newAd.title,
                contact: newAd.sellerPhone + (newAd.sellerEmail ? ` / ${newAd.sellerEmail}` : ''),
                slot: newAd.category || 'Classified Listing',
                startDate: todayStr,
                endDate: nextMonthStr,
                price: priceNum,
                status: 'Confirmed'
            });

            localStorage.setItem('classifiedDB', JSON.stringify(db));

            alert('Congratulations! Your ad has been published successfully and is now live on the Home Page.');
            window.location.href = isFeatured ? 'index.html#featured' : 'index.html#latest';
        });
    }
}

// Database initialization and default seeding
function initDB() {
    if (!localStorage.getItem('classifiedDB')) {
        const defaultAds = [
            {
                id: 'ad_101',
                title: 'Toyota Prius 2018 Safety Sense',
                category: 'Cars & Vehicles',
                price: 'Rs. 8,500,000',
                contact: '0771234567',
                description: 'Excellent condition Prius 2018 Safety Sense, low mileage, single owner.',
                image: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Colombo',
                postedTime: '2 hours ago',
                featured: true
            },
            {
                id: 'ad_102',
                title: 'iPhone 15 Pro Max 256GB Natural Titanium',
                category: 'Mobile Phones',
                price: 'Rs. 345,000',
                contact: '0777654321',
                description: 'Brand new condition, full set with box, original apple care warranty remaining.',
                image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Kandy',
                postedTime: '5 hours ago',
                featured: true
            },
            {
                id: 'ad_103',
                title: 'Luxury 3BR Apartment in Rajagiriya',
                category: 'Property',
                price: 'Rs. 42,000,000',
                contact: '0711122334',
                description: 'Fully furnished luxury apartment, 3 bedrooms, swimming pool, gym access, 24/7 security.',
                image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Rajagiriya',
                postedTime: '1 day ago',
                featured: true
            },
            {
                id: 'ad_104',
                title: 'MacBook Air M2 8GB / 256GB Space Gray',
                category: 'Electronics',
                price: 'Rs. 280,000',
                contact: '0755556666',
                description: 'Space gray MacBook Air with Apple M2 chip. Barely used, battery health 100%.',
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Gampaha',
                postedTime: '1 day ago',
                featured: true
            },
            {
                id: 'ad_105',
                title: 'Sony WH-1000XM5 Wireless Headphones',
                category: 'Electronics',
                price: 'Rs. 85,000',
                contact: '0772223334',
                description: 'Sony flagship noise cancelling wireless headphones, brand new boxed with warranty.',
                image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Dehiwala',
                postedTime: '10 mins ago',
                featured: false
            },
            {
                id: 'ad_106',
                title: 'Yamaha FZ Version 3.0 Motorbike',
                category: 'Cars & Vehicles',
                price: 'Rs. 720,000',
                contact: '0779998887',
                description: 'Yamaha FZ v3.0, mileage 15000km, showroom condition, clear documents.',
                image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Kurunegala',
                postedTime: '35 mins ago',
                featured: false
            },
            {
                id: 'ad_107',
                title: 'Teak Wood 5-Seater Sofa Set',
                category: 'General',
                price: 'Rs. 110,000',
                contact: '0722221111',
                description: 'Genuine teak wood sofa set with cushions, extremely durable and elegant design.',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Moratuwa',
                postedTime: '1 hr ago',
                featured: false
            },
            {
                id: 'ad_108',
                title: 'Nike Air Max Red Edition (Brand New)',
                category: 'Fashion',
                price: 'Rs. 24,500',
                contact: '0773334445',
                description: 'Brand new Nike Air Max sneakers, red edition, size 42, imported from USA.',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
                status: 'Approved',
                location: 'Negombo',
                postedTime: '2 hrs ago',
                featured: false
            }
        ];
        
        const defaultUsers = [
            { id: 1, name: 'Admin', email: 'admin@gopagez.lk', username: 'admin', password: '12345', phone: '0771234567', role: 'Admin', accountType: 'business', companyName: 'go PAGEZ Admin Office' },
            { id: 2, name: 'Kasun Perera', email: 'seller@gopagez.lk', username: 'kasun', password: '123456', phone: '0777654321', role: 'Advertiser', accountType: 'business', companyName: 'Premier Auto Trading', location: 'Colombo' },
            { id: 3, name: 'John Doe', email: 'john@example.com', username: 'johndoe', password: '123456', phone: '0711122334', role: 'Member', accountType: 'personal', location: 'Kandy' }
        ];

        const db = {
            ads: defaultAds,
            users: defaultUsers,
            categories: ['Cars & Vehicles', 'Property', 'Electronics', 'Mobile Phones', 'Jobs', 'Fashion', 'Pets'],
            banners: [
                { id: 1001, client: 'Sample Home Sponsor', slot: 'Home Page Main Banner', link: '#', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80' },
                { id: 1002, client: 'Top Header Brand',    slot: 'Header Top Banner',     link: '#', image: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?auto=format&fit=crop&w=1200&h=150&q=80' },
                { id: 1003, client: 'Square Deal',         slot: 'Square Ad',             link: '#', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&h=250&q=80' }
            ],
            bookings: [],
            quotations: []
        };
        localStorage.setItem('classifiedDB', JSON.stringify(db));
        
        // Also populate publishedAds
        const pubAds = defaultAds.map(ad => ({
            id: ad.id,
            title: ad.title,
            price: ad.price,
            category: ad.category,
            categoryKey: ad.category.split(' > ')[0].toLowerCase().trim(),
            location: ad.location,
            image: ad.image,
            description: ad.description,
            package: ad.featured ? 'featured' : 'free',
            postedTime: ad.postedTime
        }));
        localStorage.setItem('publishedAds', JSON.stringify(pubAds));
    }
}

// ======================================================
// CATEGORY FILTER & SEARCH ENGINE (ALL-ADS.HTML)
// ======================================================
const ALL_CATEGORIES = [
    { key: 'all', name: 'All Categories', icon: 'fa-solid fa-border-all' },
    { key: 'cars', name: 'Cars & Vehicles', icon: 'fa-solid fa-car' },
    { key: 'property', name: 'Property', icon: 'fa-solid fa-house' },
    { key: 'electronics', name: 'Electronics', icon: 'fa-solid fa-laptop' },
    { key: 'mobile', name: 'Mobile Phones', icon: 'fa-solid fa-mobile-screen-button' },
    { key: 'jobs', name: 'Jobs', icon: 'fa-solid fa-briefcase' },
    { key: 'fashion', name: 'Fashion', icon: 'fa-solid fa-shirt' },
    { key: 'pets', name: 'Pets', icon: 'fa-solid fa-paw' },
    { key: 'services', name: 'Services', icon: 'fa-solid fa-screwdriver-wrench' },
    { key: 'home', name: 'Home & Living', icon: 'fa-solid fa-couch' }
];

let activeFilterCategory = 'all';
let activeFilterSubcategory = '';

function normalizeCategoryKey(catStr) {
    if (!catStr) return 'all';
    const s = String(catStr).toLowerCase();
    if (s.includes('car') || s.includes('vehicle') || s.includes('auto') || s.includes('bike')) return 'cars';
    if (s.includes('property') || s.includes('house') || s.includes('land') || s.includes('apartment') || s.includes('rent')) return 'property';
    if (s.includes('electronic') || s.includes('laptop') || s.includes('tv') || s.includes('camera') || s.includes('appliance')) return 'electronics';
    if (s.includes('mobile') || s.includes('phone') || s.includes('tablet') || s.includes('sim')) return 'mobile';
    if (s.includes('job') || s.includes('career') || s.includes('vacancy')) return 'jobs';
    if (s.includes('fashion') || s.includes('clothing') || s.includes('shoe') || s.includes('watch') || s.includes('bag')) return 'fashion';
    if (s.includes('pet') || s.includes('dog') || s.includes('cat') || s.includes('bird')) return 'pets';
    if (s.includes('service') || s.includes('repair') || s.includes('class')) return 'services';
    if (s.includes('home') || s.includes('furniture') || s.includes('kitchen') || s.includes('living')) return 'home';
    return s.replace(/[^a-z0-9]/g, '');
}

function initAdsPageFilters() {
    const listingsContainer = document.getElementById('listingsContainer');
    if (!listingsContainer) return;

    // Parse URL query params
    const params = new URLSearchParams(window.location.search);
    const paramCat = params.get('category');
    const paramSub = params.get('subcategory');
    const paramQ = params.get('q');
    const paramLoc = params.get('location');
    const paramMin = params.get('price_min');
    const paramMax = params.get('price_max');

    if (paramCat) {
        activeFilterCategory = normalizeCategoryKey(paramCat);
    }
    if (paramSub) {
        activeFilterSubcategory = paramSub;
    }

    // Populate search header inputs if present
    const qInput = document.getElementById('searchInput');
    if (qInput && paramQ) qInput.value = paramQ;

    const locInput = document.getElementById('searchLocation');
    if (locInput && paramLoc) locInput.value = paramLoc;

    const catSelect = document.getElementById('searchCategory');
    if (catSelect && paramCat) catSelect.value = activeFilterCategory;

    const priceMin = document.getElementById('priceMin');
    if (priceMin && paramMin) priceMin.value = paramMin;

    const priceMax = document.getElementById('priceMax');
    if (priceMax && paramMax) priceMax.value = paramMax;

    // Attach real-time input change listeners for instant filter updates
    ['priceMin', 'priceMax', 'mPriceMin', 'mPriceMax', 'sortSelect', 'sellerIndividual', 'sellerBusiness', 'condBrandNew', 'condUsed', 'mSellerMem', 'mSellerBiz', 'mCondBrandNew', 'mCondUsed'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => applyFilters());
            if (el.tagName === 'INPUT' && el.type === 'number') {
                el.addEventListener('input', () => applyFilters());
            }
        }
    });

    const searchInp = document.getElementById('searchInput');
    if (searchInp) {
        searchInp.addEventListener('input', () => applyFilters());
    }

    const searchCat = document.getElementById('searchCategory');
    if (searchCat) {
        searchCat.addEventListener('change', function() {
            activeFilterCategory = this.value ? normalizeCategoryKey(this.value) : 'all';
            activeFilterSubcategory = '';
            renderCategoryFilterSidebar();
            applyFilters();
        });
    }

    renderCategoryFilterSidebar();
    applyFilters();
}

function renderCategoryFilterSidebar() {
    const desktopEl = document.getElementById('desktopCatList');
    const mobileEl = document.getElementById('mobileCatList');
    if (!desktopEl && !mobileEl) return;

    const publishedAds = JSON.parse(localStorage.getItem('publishedAds') || '[]');

    // Count ads per category
    const catCounts = { all: publishedAds.length };
    ALL_CATEGORIES.forEach(c => {
        if (c.key !== 'all') {
            catCounts[c.key] = publishedAds.filter(ad => {
                const adCatKey = ad.categoryKey || normalizeCategoryKey(ad.category);
                return adCatKey === c.key;
            }).length;
        }
    });

    const generateHtml = (isMobile = false) => {
        return ALL_CATEGORIES.map(cat => {
            const isActive = activeFilterCategory === cat.key;
            const count = catCounts[cat.key] || 0;
            const subcats = subcategoriesData[cat.key] || [];

            let subcatHtml = '';
            if (isActive && subcats.length > 0 && cat.key !== 'all') {
                subcatHtml = `
                    <div class="subcat-box">
                        <span class="subcat-chip ${activeFilterSubcategory === '' ? 'active' : ''}" onclick="selectSubcategory('')">All in ${cat.name}</span>
                        ${subcats.map(sub => {
                            const isSubActive = activeFilterSubcategory.toLowerCase() === sub.toLowerCase();
                            const escapedSub = sub.replace(/'/g, "\\'");
                            return `<span class="subcat-chip ${isSubActive ? 'active' : ''}" onclick="selectSubcategory('${escapedSub}')">${sub}</span>`;
                        }).join('')}
                    </div>
                `;
            }

            return `
                <div class="cat-item-wrapper mb-1">
                    <button type="button" class="cat-item-btn ${isActive ? 'active-cat' : ''}" onclick="selectCategory('${cat.key}')">
                        <span><i class="${cat.icon} me-2 ${isActive ? 'text-white' : 'text-primary'}"></i> ${cat.name}</span>
                        <span class="cat-count">${count}</span>
                    </button>
                    ${subcatHtml}
                </div>
            `;
        }).join('');
    };

    if (desktopEl) desktopEl.innerHTML = generateHtml(false);
    if (mobileEl) mobileEl.innerHTML = generateHtml(true);

    // Sync searchCategory select
    const searchCat = document.getElementById('searchCategory');
    if (searchCat && searchCat.value !== activeFilterCategory) {
        searchCat.value = activeFilterCategory === 'all' ? '' : activeFilterCategory;
    }
}

function selectCategory(catKey) {
    activeFilterCategory = catKey;
    activeFilterSubcategory = '';
    
    // Sync search header dropdown
    const searchCat = document.getElementById('searchCategory');
    if (searchCat) {
        searchCat.value = catKey === 'all' ? '' : catKey;
    }

    renderCategoryFilterSidebar();
    applyFilters();
}

function selectSubcategory(subcat) {
    activeFilterSubcategory = subcat;
    renderCategoryFilterSidebar();
    applyFilters();
}

function handleTopSearch(e) {
    if (e) e.preventDefault();
    const catSelect = document.getElementById('searchCategory');
    if (catSelect) {
        activeFilterCategory = catSelect.value ? normalizeCategoryKey(catSelect.value) : 'all';
        activeFilterSubcategory = '';
    }
    renderCategoryFilterSidebar();
    applyFilters();
}

function applyFilters() {
    const listingsContainer = document.getElementById('listingsContainer');
    if (!listingsContainer) return;

    const publishedAds = JSON.parse(localStorage.getItem('publishedAds') || '[]');

    // Get filter values
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const location = (document.getElementById('searchLocation')?.value || '').toLowerCase().trim();
    
    const minPriceVal = document.getElementById('priceMin')?.value || document.getElementById('mPriceMin')?.value || '';
    const maxPriceVal = document.getElementById('priceMax')?.value || document.getElementById('mPriceMax')?.value || '';
    const minPrice = minPriceVal !== '' ? Number(minPriceVal) : null;
    const maxPrice = maxPriceVal !== '' ? Number(maxPriceVal) : null;

    const allowIndividual = (document.getElementById('sellerIndividual')?.checked ?? true) && (document.getElementById('mSellerMem')?.checked ?? true);
    const allowBusiness = (document.getElementById('sellerBusiness')?.checked ?? true) && (document.getElementById('mSellerBiz')?.checked ?? true);

    const allowBrandNew = (document.getElementById('condBrandNew')?.checked ?? true) && (document.getElementById('mCondBrandNew')?.checked ?? true);
    const allowUsed = (document.getElementById('condUsed')?.checked ?? true) && (document.getElementById('mCondUsed')?.checked ?? true);

    const sortOption = document.getElementById('sortSelect')?.value || 'newest';

    const parseNumPrice = (priceStr) => {
        if (!priceStr) return 0;
        const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
    };

    // Filter array
    let filtered = publishedAds.filter(ad => {
        // 1. Category Filter
        if (activeFilterCategory !== 'all') {
            const adCatKey = ad.categoryKey || normalizeCategoryKey(ad.category);
            if (adCatKey !== activeFilterCategory) return false;
        }

        // 2. Subcategory Filter
        if (activeFilterSubcategory) {
            const adSub = (ad.subcategory || '').toLowerCase();
            const targetSub = activeFilterSubcategory.toLowerCase();
            const adCatFull = (ad.category || '').toLowerCase();
            if (!adSub.includes(targetSub) && !adCatFull.includes(targetSub)) return false;
        }

        // 3. Search Query Filter
        if (query) {
            const title = (ad.title || '').toLowerCase();
            const desc = (ad.description || '').toLowerCase();
            const cat = (ad.category || '').toLowerCase();
            if (!title.includes(query) && !desc.includes(query) && !cat.includes(query)) return false;
        }

        // 4. Location Filter
        if (location) {
            const adLoc = (ad.location || '').toLowerCase();
            if (!adLoc.includes(location)) return false;
        }

        // 5. Price Range Filter
        const adPriceNum = parseNumPrice(ad.price);
        if (minPrice !== null && !isNaN(minPrice) && minPrice > 0) {
            if (adPriceNum < minPrice) return false;
        }
        if (maxPrice !== null && !isNaN(maxPrice) && maxPrice > 0) {
            if (adPriceNum > maxPrice) return false;
        }

        return true;
    });

    // Sort array
    if (sortOption === 'price_low') {
        filtered.sort((a, b) => parseNumPrice(a.price) - parseNumPrice(b.price));
    } else if (sortOption === 'price_high') {
        filtered.sort((a, b) => parseNumPrice(b.price) - parseNumPrice(a.price));
    } else if (sortOption === 'title_az') {
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    // Render results
    listingsContainer.innerHTML = '';
    const resultsCountEl = document.getElementById('resultsCountText');

    let categoryLabel = 'All Categories';
    if (activeFilterCategory !== 'all') {
        const found = ALL_CATEGORIES.find(c => c.key === activeFilterCategory);
        if (found) categoryLabel = found.name;
    }
    if (activeFilterSubcategory) {
        categoryLabel += ` &bull; ${activeFilterSubcategory}`;
    }

    if (resultsCountEl) {
        resultsCountEl.innerHTML = `Showing <strong>${filtered.length}</strong> Ads in <span class="text-primary fw-bold">${categoryLabel}</span>`;
    }

    if (filtered.length === 0) {
        listingsContainer.innerHTML = `
            <div class="col-12 text-center py-5 text-muted bg-white rounded-3 p-4 shadow-sm">
                <i class="fa-solid fa-filter-circle-xmark fs-1 mb-3 text-warning"></i>
                <h5 class="fw-bold">No ads match your criteria</h5>
                <p class="small mb-3">Try adjusting or clearing your category filters, price range, or search keyword.</p>
                <button class="btn btn-outline-primary btn-sm px-3" onclick="resetAllFilters()">
                    <i class="fa-solid fa-rotate-left me-1"></i> Clear Filters
                </button>
            </div>
        `;
    } else {
        filtered.forEach(ad => {
            const cardHtml = createBrowseCardHtml(ad);
            listingsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    }
}

function resetAllFilters() {
    activeFilterCategory = 'all';
    activeFilterSubcategory = '';

    const qInput = document.getElementById('searchInput');
    if (qInput) qInput.value = '';

    const locInput = document.getElementById('searchLocation');
    if (locInput) locInput.value = '';

    const catSelect = document.getElementById('searchCategory');
    if (catSelect) catSelect.value = '';

    const priceMin = document.getElementById('priceMin');
    if (priceMin) priceMin.value = '';
    const priceMax = document.getElementById('priceMax');
    if (priceMax) priceMax.value = '';

    const mPriceMin = document.getElementById('mPriceMin');
    if (mPriceMin) mPriceMin.value = '';
    const mPriceMax = document.getElementById('mPriceMax');
    if (mPriceMax) mPriceMax.value = '';

    ['sellerIndividual', 'sellerBusiness', 'condBrandNew', 'condUsed', 'mSellerMem', 'mSellerBiz', 'mCondBrandNew', 'mCondUsed'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'newest';

    renderCategoryFilterSidebar();
    applyFilters();
}

// Function to render published ads on Home Page & All Ads page
function loadPublishedAds() {
    const publishedAds = JSON.parse(localStorage.getItem('publishedAds') || '[]');
    
    // Select Home Page rows
    const featuredRow = document.getElementById('featuredAdsRow');
    const latestRow = document.getElementById('latestAdsRow');
    // Select All Ads page container
    const listingsContainer = document.getElementById('listingsContainer');

    // 1. Render on Home Page (index.html)
    if (latestRow) {
        latestRow.innerHTML = '';
        if (featuredRow) featuredRow.innerHTML = '';

        if (publishedAds.length === 0) {
            const emptyHtml = `<div class="col-12 text-center py-5 text-muted">
                <i class="fa-regular fa-folder-open fs-1 mb-3 text-secondary"></i>
                <p class="mb-0">No active ads found. Post a new ad to get started!</p>
            </div>`;
            latestRow.innerHTML = emptyHtml;
            if (featuredRow) featuredRow.innerHTML = emptyHtml;
        } else {
            // Render latest ads (all approved ads)
            publishedAds.forEach(ad => {
                const adCardHtml = createListingCardHtml(ad);
                latestRow.insertAdjacentHTML('beforeend', adCardHtml);
            });

            // Render featured ads
            const featuredAds = publishedAds.filter(ad => ad.package === 'featured');
            if (featuredRow) {
                if (featuredAds.length === 0) {
                    featuredRow.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>No featured ads currently.</p></div>`;
                } else {
                    featuredAds.forEach(ad => {
                        const adCardHtml = createListingCardHtml(ad);
                        featuredRow.insertAdjacentHTML('beforeend', adCardHtml);
                    });
                }
            }
        }
    }

    // 2. Render on All Ads page (all-ads.html) with full category filter engine
    if (listingsContainer) {
        initAdsPageFilters();
    }
}

// Render Banner Ads uploaded via Admin Panel onto Home Page & All Ads Page
function renderBannerAds() {
    const db = JSON.parse(localStorage.getItem('classifiedDB') || '{}');
    const banners = db.banners || [];

    if (banners.length === 0) return;

    // Filter to latest banner for each slot
    const latestBannersBySlot = {};
    banners.forEach(b => {
        latestBannersBySlot[b.slot] = b;
    });

    // Helper to check if media is video
    const isVideoMedia = (src) => {
        if (!src) return false;
        return src.startsWith('data:video/') || /\.(mp4|webm|ogv)(\?.*)?$/i.test(src);
    };

    // Helper to render media tag (Video or Image/GIF)
    const createBannerMediaTag = (banner, customStyle = '', customClass = '') => {
        const isVid = isVideoMedia(banner.image) || banner.mediaType === 'video';
        const idbAttr = banner.image && banner.image.startsWith('idb://') ? `data-idb-key="${banner.image.replace('idb://','')}"` : '';
        if (isVid) {
            const hasControls = banner.videoControls ? 'controls' : '';
            const loopAttr = banner.videoLoop !== false ? 'loop' : '';
            const autoAttr = banner.videoAutoplay !== false ? 'autoplay' : '';
            return `<video src="${banner.image}" ${autoAttr} ${loopAttr} muted playsinline ${hasControls} ${idbAttr} class="banner-fill w-100 ${customClass}" style="object-fit:cover; display:block; border-radius:16px; ${customStyle}"></video>`;
        }
        return `<img src="${banner.image}" alt="${banner.client || 'Sponsored Ad'}" ${idbAttr} class="banner-fill w-100 ${customClass}" style="object-fit:cover; display:block; border-radius:16px; ${customStyle}">`;
    };

    // Resolve any IndexedDB media in background
    setTimeout(async () => {
        const idbElements = document.querySelectorAll('[data-idb-key]');
        for (let el of idbElements) {
            const key = el.getAttribute('data-idb-key');
            if (key) {
                const realSrc = await getMediaItem(key);
                if (realSrc) {
                    el.src = realSrc;
                    if (el.tagName === 'VIDEO') {
                        el.load();
                        el.play().catch(() => {});
                    }
                }
            }
        }
    }, 50);

    // Helper to generate banner HTML
    const createBannerHtml = (banner, addContainerClass = '') => `
        <div class="ad-banner uploaded-banner ${addContainerClass}">
            <div class="ad-banner-tag">SPONSORED</div>
            <a href="${banner.link || '#'}" target="_blank" class="d-block w-100 h-100 text-decoration-none">
                ${createBannerMediaTag(banner)}
            </a>
        </div>
    `;

    // Map slots to DOM container IDs
    const slotMap = {
        'Header Top Banner': 'headerTopBannerSlot',
        'Home Page Main Banner': 'homeMainBannerSlot',
        'Bottom Banner Ad': 'bottomBannerSlot',
        'Footer Banner': 'footerBannerSlot',
        'Sidebar Right Ad': 'sidebarRightBannerSlot',
        'Skyscraper': 'skyscraperBannerSlot',
        'Square Ad': 'squareAdBannerSlot'
    };

    // Inject standard banners
    for (const [slotName, containerId] of Object.entries(slotMap)) {
        const banner = latestBannersBySlot[slotName];
        const container = document.getElementById(containerId);
        
        if (banner && container) {
            if (slotName === 'Header Top Banner') {
                container.innerHTML = `
                    <a href="${banner.link || '#'}" target="_blank" class="header-banner-link d-block w-100 text-center" style="background: transparent;">
                        ${createBannerMediaTag(banner, 'max-height: 90px; border-radius:8px;')}
                    </a>
                `;
                container.style.display = 'block';
            } else {
                container.innerHTML = createBannerHtml(banner, slotName === 'Home Page Main Banner' || slotName === 'Bottom Banner Ad' ? 'my-4' : 'mb-4');
                container.style.display = 'block';
            }

            if (slotName === 'Home Page Main Banner') {
                const defTop = document.getElementById('defaultTopBanner');
                if (defTop) defTop.style.display = 'none';
            }
        }
    }

    // Handle Popups
    const homePopupBanner = latestBannersBySlot['Home Page Popup Banner'];
    const categoryPopupBanner = latestBannersBySlot['Category Inside Popup Banner'];

    // If on index.html and have a home popup
    if (homePopupBanner && document.getElementById('homePopupModal')) {
        document.getElementById('homePopupModalContent').innerHTML = `
            <a href="${homePopupBanner.link || '#'}" target="_blank" class="d-block w-100">
                ${createBannerMediaTag(homePopupBanner, 'width:100%; max-height:480px;')}
            </a>
        `;
        const homeModal = new bootstrap.Modal(document.getElementById('homePopupModal'));
        setTimeout(() => homeModal.show(), 3000); // Show after 3s
    }

    // If on all-ads.html and have a category popup
    if (categoryPopupBanner && document.getElementById('categoryPopupModal')) {
        document.getElementById('categoryPopupModalContent').innerHTML = `
            <a href="${categoryPopupBanner.link || '#'}" target="_blank" class="d-block w-100">
                ${createBannerMediaTag(categoryPopupBanner, 'width:100%; max-height:480px;')}
            </a>
        `;
        const categoryModal = new bootstrap.Modal(document.getElementById('categoryPopupModal'));
        setTimeout(() => categoryModal.show(), 2000); // Show after 2s
    }

    // Handle In-Feed Sponsored Post
    const inFeedBanner = latestBannersBySlot['In-Feed Sponsored Post'];
    if (inFeedBanner) {
        const listingsContainer = document.getElementById('listingsContainer');
        const latestRow = document.querySelector('#latest .row');
        
        const inFeedHtml = `
            <div class="col-md-6 col-lg-3 user-posted-ad" data-aos="fade-up">
                <div class="card h-100 border-0 shadow-sm listing-card bg-body" style="border: 2px solid #2563eb !important;">
                    <div class="listing-img-wrapper">
                        <span class="badge-featured" style="background:#2563eb;"><i class="fa-solid fa-bullhorn me-1"></i> SPONSORED</span>
                        <a href="${inFeedBanner.link || '#'}" target="_blank" class="d-block w-100 h-100">
                            ${createBannerMediaTag(inFeedBanner, 'height:100%;')}
                        </a>
                    </div>
                    <div class="card-body p-3">
                        <div class="text-muted small mb-1"><i class="fa-solid fa-star me-1 text-warning"></i> Sponsored Video &amp; Deal</div>
                        <h5 class="card-title h6 fw-bold mb-2">
                            <a href="${inFeedBanner.link || '#'}" target="_blank" class="text-decoration-none text-body">${inFeedBanner.client || 'Special Offer'}</a>
                        </h5>
                        <p class="text-muted small mb-3">Check out our latest featured campaigns and deals.</p>
                        <a href="${inFeedBanner.link || '#'}" target="_blank" class="btn btn-outline-primary btn-sm w-100 fw-bold">Watch &amp; Learn More</a>
                    </div>
                </div>
            </div>
        `;
        
        if (latestRow) {
            // Insert in the middle of the latest row
            const children = latestRow.children;
            const insertIdx = Math.floor(children.length / 2);
            if (children.length > 0) {
                children[insertIdx].insertAdjacentHTML('beforebegin', inFeedHtml);
            } else {
                latestRow.innerHTML = inFeedHtml;
            }
        }
        
        if (listingsContainer) {
            // Adapt for all-ads page
             const inFeedBrowseHtml = `
                <div class="col ad-item user-posted-ad">
                    <div class="card h-100 border-0 shadow-sm hover-lift position-relative ad-card" style="border: 2px solid #2563eb !important;">
                        <span class="badge bg-primary text-white position-absolute top-0 start-0 m-2 fw-bold" style="z-index:2;">Sponsored</span>
                        <div class="ad-img-col bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center overflow-hidden" style="min-height: 180px;">
                            <a href="${inFeedBanner.link || '#'}" target="_blank" style="width:100%; height:100%; display:block;">
                                ${createBannerMediaTag(inFeedBanner, 'height:100%;')}
                            </a>
                        </div>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <span class="badge bg-light text-primary mb-2">Advertisement</span>
                                <h5 class="card-title fw-bold text-truncate mb-1"><a href="${inFeedBanner.link || '#'}" target="_blank" class="text-decoration-none text-dark">${inFeedBanner.client || 'Special Offer'}</a></h5>
                                <p class="card-text text-muted small mb-2">Explore our premium services.</p>
                            </div>
                            <div class="pt-2 border-top">
                                <a href="${inFeedBanner.link || '#'}" target="_blank" class="btn btn-primary btn-sm w-100 fw-bold">Visit Sponsor</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const children = listingsContainer.children;
            const insertIdx = Math.min(2, children.length); // Insert after 2nd item if possible
            if (children.length > 0) {
                children[insertIdx].insertAdjacentHTML('beforebegin', inFeedBrowseHtml);
            } else {
                 listingsContainer.innerHTML = inFeedBrowseHtml;
            }
        }
    }
}

// HTML Generator for Home Page Card
function createListingCardHtml(ad) {
    const detailLink = (ad.categoryKey === 'property' ? 'property-ad-details.html' : 'ad-details.html') + `?id=${encodeURIComponent(ad.id)}`;
    const isFeaturedBadge = ad.package === 'featured' ? '<span class="badge-featured"><i class="fa-solid fa-bolt me-1"></i> FEATURED</span>' : '';
    const subCatDisplay = ad.subcategory ? ` &bull; ${ad.subcategory}` : '';

    return `
        <div class="col-md-6 col-lg-3 user-posted-ad" data-aos="fade-up">
            <div class="card h-100 border-0 shadow-sm listing-card bg-body">
                <div class="listing-img-wrapper">
                    ${isFeaturedBadge}
                    <button class="like-btn" title="Save Ad"><i class="fa-regular fa-heart"></i></button>
                    <a href="${detailLink}">
                        <img src="${ad.image}" alt="${ad.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </a>
                </div>
                <div class="card-body p-3">
                    <div class="text-muted small mb-1"><i class="fa-solid fa-tag me-1"></i> ${ad.category}${subCatDisplay}</div>
                    <h5 class="card-title h6 fw-bold mb-2">
                        <a href="${detailLink}" class="text-decoration-none text-body">${ad.title}</a>
                    </h5>
                    <h6 class="text-primary fw-bold mb-3">${ad.price}</h6>
                    <div class="d-flex justify-content-between text-muted small border-top pt-2">
                        <span><i class="fa-solid fa-location-dot me-1"></i> ${ad.location}</span>
                        <span class="badge bg-success bg-opacity-10 text-success">${ad.postedTime}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// HTML Generator for All Ads Page Card
function createBrowseCardHtml(ad) {
    const detailLink = (ad.categoryKey === 'property' ? 'property-ad-details.html' : 'ad-details.html') + `?id=${encodeURIComponent(ad.id)}`;
    const isFeaturedBadge = ad.package === 'featured' ? '<span class="badge bg-warning text-dark position-absolute top-0 start-0 m-2 fw-bold" style="z-index:2;">Featured ⭐</span>' : '';
    const subCatBadge = ad.subcategory ? `<span class="badge bg-secondary-subtle text-secondary mb-2 ms-1">${ad.subcategory}</span>` : '';

    return `
        <div class="col ad-item user-posted-ad">
            <div class="card h-100 border-0 shadow-sm hover-lift position-relative ad-card">
                ${isFeaturedBadge}
                <div class="ad-img-col bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center overflow-hidden" style="min-height: 180px;">
                    <a href="${detailLink}" style="width: 100%; height: 100%; display: block;">
                        <img src="${ad.image}" alt="${ad.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </a>
                </div>
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <span class="badge bg-light text-primary mb-2">${ad.category}</span>
                        ${subCatBadge}
                        <h5 class="card-title fw-bold text-truncate mb-1"><a href="${detailLink}" class="text-decoration-none text-dark">${ad.title}</a></h5>
                        <h6 class="text-primary fw-bold mb-2">${ad.price}</h6>
                        <p class="card-text text-muted small mb-2"><i class="fa-solid fa-location-dot me-1"></i> ${ad.location}</p>
                    </div>
                    <div class="pt-2 border-top d-flex justify-content-between align-items-center text-muted small">
                        <span><i class="fa-regular fa-clock me-1"></i> ${ad.postedTime}</span>
                        <span class="badge bg-primary bg-opacity-10 text-primary fw-bold">New Post</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to populate dynamic details on ad-details.html and property-ad-details.html
function loadAdDetails() {
    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');

    const publishedAds = JSON.parse(localStorage.getItem('publishedAds') || '[]');
    const db = JSON.parse(localStorage.getItem('classifiedDB') || '{}');
    const allAds = [...publishedAds, ...(db.ads || [])];

    let ad = null;
    if (adId) {
        ad = allAds.find(a => String(a.id) === String(adId));
    }
    if (!ad && publishedAds.length > 0) {
        ad = publishedAds[0];
    }

    if (!ad) return;

    // Page title & breadcrumb
    document.title = `${ad.title} - go PAGEZ`;

    const breadcrumbTitle = document.getElementById('adBreadcrumbTitle');
    if (breadcrumbTitle) breadcrumbTitle.textContent = ad.title;

    // Header & Titles
    const titleEls = document.querySelectorAll('.ad-title-display');
    titleEls.forEach(el => el.textContent = ad.title);

    const priceEls = document.querySelectorAll('.ad-price-display');
    priceEls.forEach(el => el.textContent = ad.price);

    const locationEls = document.querySelectorAll('.ad-location-display');
    locationEls.forEach(el => el.innerHTML = `<i class="fa-solid fa-location-dot me-1"></i> ${ad.location}`);

    const timeEls = document.querySelectorAll('.ad-time-display');
    timeEls.forEach(el => el.innerHTML = `<i class="fa-solid fa-clock me-1"></i> Posted ${ad.postedTime || 'recently'}`);

    const idEls = document.querySelectorAll('#adIdDisplay');
    idEls.forEach(el => el.innerHTML = `<i class="fa-solid fa-tag me-1"></i> Ad ID: #${ad.id}`);

    // Images Gallery (Supports up to 10 images)
    const images = (ad.images && ad.images.length > 0) ? ad.images : [ad.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'];

    const carouselInner = document.getElementById('adCarouselInner');
    const thumbnailsContainer = document.getElementById('adGalleryThumbnails');

    if (carouselInner) {
        carouselInner.innerHTML = '';
        images.slice(0, 10).forEach((imgUrl, idx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `carousel-item h-100 ${idx === 0 ? 'active' : ''}`;
            itemDiv.innerHTML = `
                <img src="${imgUrl}" class="d-block w-100 h-100" style="object-fit: contain; background: #0f172a;" alt="Photo ${idx + 1}">
            `;
            carouselInner.appendChild(itemDiv);
        });
    }

    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        images.slice(0, 10).forEach((imgUrl, idx) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'border rounded flex-shrink-0 overflow-hidden shadow-sm';
            thumbDiv.style.width = '80px';
            thumbDiv.style.height = '60px';
            thumbDiv.style.cursor = 'pointer';
            thumbDiv.setAttribute('data-bs-target', '#adImageGallery');
            thumbDiv.setAttribute('data-bs-slide-to', idx);
            thumbDiv.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">`;
            thumbnailsContainer.appendChild(thumbDiv);
        });
    }

    // Description
    const descriptionEl = document.getElementById('adDescriptionDisplay');
    if (descriptionEl) {
        descriptionEl.innerHTML = ad.description ? ad.description.replace(/\n/g, '<br>') : 'No description provided for this listing.';
    }

    // Seller Info
    const sellerName = ad.sellerName || 'Kasun Perera';
    const sellerPhone = ad.sellerPhone || ad.contact || '077 123 4567';
    const sellerEmail = ad.sellerEmail || 'seller@example.com';
    const sellerWhatsapp = ad.sellerWhatsapp || sellerPhone;

    const sellerNameEls = document.querySelectorAll('.seller-name-display');
    sellerNameEls.forEach(el => el.textContent = sellerName);

    const sellerAvatarEls = document.querySelectorAll('.seller-avatar-display');
    sellerAvatarEls.forEach(el => el.textContent = (sellerName[0] || 'S').toUpperCase());

    const phoneBtn = document.getElementById('showPhoneBtn');
    if (phoneBtn) {
        if (ad.hidePhone) {
            phoneBtn.innerHTML = `<i class="fa-solid fa-eye-slash me-2"></i> Number Hidden`;
            phoneBtn.disabled = true;
        } else {
            phoneBtn.innerHTML = `<i class="fa-solid fa-phone me-2"></i> Show Phone Number`;
            phoneBtn.onclick = function() {
                this.innerHTML = `<i class="fa-solid fa-phone me-2"></i> ${sellerPhone}`;
            };
        }
    }

    const chatBtn = document.getElementById('chatSellerBtn');
    if (chatBtn) {
        const cleanWa = sellerWhatsapp.replace(/[^0-9]/g, '');
        if (cleanWa) {
            chatBtn.href = `https://wa.me/${cleanWa}?text=Hi%20${encodeURIComponent(sellerName)},%20I%20am%20interested%20in%20your%20ad:%20${encodeURIComponent(ad.title)}`;
            chatBtn.target = '_blank';
        } else {
            chatBtn.href = `mailto:${sellerEmail}?subject=Inquiry%20about%20${encodeURIComponent(ad.title)}`;
        }
    }
}

// Global User Session & Navbar Auth Synchronization
function initNavbarAuth() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    let user;
    try {
        user = JSON.parse(userJson);
    } catch (e) {
        return;
    }

    if (!user || !user.name) return;

    const userInitial = user.name.charAt(0).toUpperCase();
    const roleBadge = user.role === 'Admin' ? 'bg-danger' : (user.role === 'Advertiser' ? 'bg-primary' : 'bg-success');
    const adminLinkHtml = user.role === 'Admin' ? `<li><a class="dropdown-item py-2" href="admin-panel.html"><i class="fa-solid fa-shield-halved text-danger me-2"></i> Admin Portal</a></li>` : '';

    const userDropdownHtml = `
        <div class="dropdown user-nav-dropdown d-inline-block">
            <button class="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="user-avatar-badge">${userInitial}</span>
                <span class="fw-bold text-body small text-truncate" style="max-width:110px;">${user.name}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 mt-2 py-2">
                <li class="px-3 py-2 border-bottom mb-1">
                    <div class="fw-bold small text-body text-truncate">${user.name}</div>
                    <div class="small text-muted" style="font-size:11px;">${user.email || user.phone || 'Member'}</div>
                    <span class="badge ${roleBadge} mt-1" style="font-size:10px;">${user.role || 'Member'}</span>
                </li>
                <li><a class="dropdown-item py-2" href="post-ad.html"><i class="fa-solid fa-plus text-primary me-2"></i> Post Free Ad</a></li>
                <li><a class="dropdown-item py-2" href="all-ads.html"><i class="fa-solid fa-magnifying-glass text-muted me-2"></i> Browse Classifieds</a></li>
                ${adminLinkHtml}
                <li><hr class="dropdown-divider my-1"></li>
                <li><a class="dropdown-item py-2 text-danger" href="#" onclick="globalLogout(event)"><i class="fa-solid fa-right-from-bracket me-2"></i> Logout</a></li>
            </ul>
        </div>
    `;

    // Replace login/register buttons in navbar if present
    const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="register.html"]');
    if (loginLinks.length > 0) {
        const parentNav = loginLinks[0].closest('.d-flex, ul, .navbar-nav');
        if (parentNav) {
            loginLinks.forEach(link => {
                const li = link.closest('li');
                if (li) li.remove();
                else link.remove();
            });

            // Insert dropdown before Post Ad or at end of nav
            const postAdBtn = parentNav.querySelector('a[href="post-ad.html"]');
            if (postAdBtn) {
                const container = postAdBtn.closest('li') || postAdBtn;
                container.insertAdjacentHTML('beforebegin', userDropdownHtml);
            } else {
                parentNav.insertAdjacentHTML('beforeend', userDropdownHtml);
            }
        }
    }
}

function globalLogout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminLogin');
    window.location.reload();
}

// ======================================================
// GLOBAL FRONTEND WEBSITE CUSTOMIZATION LOADER (ENTERPRISE)
// ======================================================
function applySiteCustomizations() {
    const savedConfig = localStorage.getItem('siteCustomConfig');
    if (!savedConfig) return;

    let cfg;
    try {
        cfg = JSON.parse(savedConfig);
    } catch (e) {
        return;
    }

    if (!cfg) return;

    // 1. Maintenance Mode Check
    if (cfg.maintenanceMode) {
        const isCurrentAdmin = localStorage.getItem('adminLogin') || localStorage.getItem('currentUser');
        const isExcludedPath = window.location.pathname.includes('admin-panel.html') || window.location.pathname.includes('login.html');
        const urlParams = new URLSearchParams(window.location.search);
        const hasSecretBypass = cfg.maintSecret && urlParams.get('bypass') === cfg.maintSecret;

        if (!isCurrentAdmin && !isExcludedPath && !hasSecretBypass) {
            if (!document.getElementById('maintModeOverlay')) {
                const maintDiv = document.createElement('div');
                maintDiv.id = 'maintModeOverlay';
                maintDiv.style.cssText = `position: fixed; inset: 0; z-index: 999999; background: #0f172a; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; font-family: 'Plus Jakarta Sans', sans-serif;`;
                maintDiv.innerHTML = `
                    <div style="max-width: 540px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); backdrop-filter: blur(16px);">
                        <img src="${cfg.logoUrl || 'images/logo.png'}" alt="Logo" style="height: 48px; object-fit: contain; margin-bottom: 24px;">
                        <div style="display:inline-block; padding:6px 16px; border-radius:20px; background:rgba(239,68,68,0.2); color:#f87171; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">
                            <i class="fa-solid fa-wrench me-1"></i> System Maintenance
                        </div>
                        <h2 style="font-size: 26px; font-weight: 800; margin-bottom: 12px; color: #ffffff;">${cfg.maintTitle || 'We will be back shortly!'}</h2>
                        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">${cfg.maintNotice || 'Our marketplace is currently undergoing a scheduled performance upgrade. All services will be restored momentarily.'}</p>
                        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                            <a href="admin-panel.html" class="btn btn-sm btn-outline-light" style="font-size:12px; border-radius:8px;">Admin Login</a>
                            ${cfg.contactPhone ? `<a href="tel:${cfg.contactPhone}" class="btn btn-sm btn-primary" style="background:${cfg.primaryColor || '#FA7B17'}; border:none; font-size:12px; border-radius:8px;"><i class="fa-solid fa-phone me-1"></i> Emergency Hotline</a>` : ''}
                        </div>
                    </div>
                `;
                document.body.appendChild(maintDiv);
            }
            return;
        }
    }

    // 2. Apply Brand Colors & Theme Variables
    if (cfg.primaryColor) {
        document.documentElement.style.setProperty('--brand', cfg.primaryColor);
        document.documentElement.style.setProperty('--primary', cfg.primaryColor);
        document.documentElement.style.setProperty('--bs-primary', cfg.primaryColor);
    }
    if (cfg.accentColor) {
        document.documentElement.style.setProperty('--accent', cfg.accentColor);
        document.documentElement.style.setProperty('--brand-blue', cfg.accentColor);
    }

    // 3. Apply Typography Font
    if (cfg.fontFamily) {
        document.body.style.fontFamily = cfg.fontFamily;
    }

    // 4. Apply UI Border Radius & Shadows
    if (cfg.borderRadius) {
        document.documentElement.style.setProperty('--card-radius', cfg.borderRadius + 'px');
        const cards = document.querySelectorAll('.ad-card, .category-card, .card, .btn');
        cards.forEach(c => {
            if (!c.classList.contains('btn-circle')) {
                c.style.borderRadius = cfg.borderRadius + 'px';
            }
        });
    }

    // 5. Apply Custom CSS injection
    if (cfg.customCss && !document.getElementById('injected-site-custom-css')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'injected-site-custom-css';
        styleEl.textContent = cfg.customCss;
        document.head.appendChild(styleEl);
    }

    // 6. Apply Custom Header Scripts (<head>)
    if (cfg.customScripts && !document.getElementById('injected-custom-head-scripts')) {
        const container = document.createElement('div');
        container.id = 'injected-custom-head-scripts';
        container.innerHTML = cfg.customScripts;
        document.head.appendChild(container);
    }

    // 7. Apply Logo & Sizing
    if (cfg.logoUrl) {
        const logoImgs = document.querySelectorAll('.navbar-brand img, img[src*="logo.png"]');
        logoImgs.forEach(img => {
            if (cfg.logoUrl !== 'images/logo.png') {
                img.src = cfg.logoUrl;
            }
            if (cfg.logoHeight) {
                img.style.height = cfg.logoHeight + 'px';
            }
        });
    }

    // 8. Apply Hero Section Background Media, Overlay & Text Content (Homepage)
    const heroSection = document.getElementById('heroSection') || document.querySelector('.hero-section');
    if (heroSection) {
        let heroVideo = document.getElementById('heroBgVideo');
        let heroOverlay = document.getElementById('heroBgOverlay');

        // Dynamically create video tag if not present
        if (!heroVideo) {
            heroVideo = document.createElement('video');
            heroVideo.id = 'heroBgVideo';
            heroVideo.autoplay = true;
            heroVideo.muted = true;
            heroVideo.loop = true;
            heroVideo.playsInline = true;
            heroVideo.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events:none; display:none;';
            heroSection.prepend(heroVideo);
        }

        // Dynamically create overlay if not present
        if (!heroOverlay) {
            heroOverlay = document.createElement('div');
            heroOverlay.id = 'heroBgOverlay';
            heroOverlay.style.cssText = 'position:absolute; inset:0; z-index:1; pointer-events:none; display:none;';
            if (heroVideo.nextSibling) {
                heroSection.insertBefore(heroOverlay, heroVideo.nextSibling);
            } else {
                heroSection.appendChild(heroOverlay);
            }
        }

        const heroBgType = cfg.heroBgType || 'gradient';
        const overlayOpacity = (cfg.heroBgOverlayOpacity !== undefined ? cfg.heroBgOverlayOpacity : 65) / 100;
        const overlayColor = cfg.heroBgOverlayColor || '#0b1120';

        // Apply Sizing, Height & Spacing
        if (cfg.heroHeightPreset === 'fullscreen') {
            heroSection.style.minHeight = '100vh';
            heroSection.style.display = 'flex';
            heroSection.style.alignItems = 'center';
            heroSection.style.justifyContent = 'center';
        } else if (cfg.heroHeight) {
            heroSection.style.minHeight = cfg.heroHeight + 'px';
        }
        if (cfg.heroPaddingTop) heroSection.style.paddingTop = cfg.heroPaddingTop + 'px';
        if (cfg.heroPaddingBottom) heroSection.style.paddingBottom = cfg.heroPaddingBottom + 'px';

        // Apply Overlay
        heroOverlay.style.backgroundColor = overlayColor;
        heroOverlay.style.opacity = overlayOpacity;

        const mediaFit = cfg.heroMediaFit || 'cover';
        const mediaPosition = cfg.heroMediaPosition || 'center center';

        if (heroBgType === 'video' && cfg.heroBgVideo) {
            if (cfg.heroBgVideo.startsWith('idb://')) {
                const key = cfg.heroBgVideo.replace('idb://', '');
                getMediaItem(key).then(blob => {
                    if (blob) {
                        const url = (typeof blob === 'string') ? blob : URL.createObjectURL(blob);
                        heroVideo.src = url;
                        heroVideo.style.objectFit = mediaFit;
                        heroVideo.style.objectPosition = mediaPosition;
                        heroVideo.autoplay = cfg.heroBgVideoAutoplay !== false;
                        heroVideo.muted = cfg.heroBgVideoMuted !== false;
                        heroVideo.loop = true;
                        heroVideo.style.display = 'block';
                        heroVideo.load();
                        heroVideo.play().catch(() => {});
                    }
                });
            } else {
                heroVideo.src = cfg.heroBgVideo;
                heroVideo.style.objectFit = mediaFit;
                heroVideo.style.objectPosition = mediaPosition;
                heroVideo.autoplay = cfg.heroBgVideoAutoplay !== false;
                heroVideo.muted = cfg.heroBgVideoMuted !== false;
                heroVideo.loop = true;
                heroVideo.style.display = 'block';
                heroVideo.load();
                heroVideo.play().catch(() => {});
            }
            heroOverlay.style.display = 'block';
            heroSection.style.backgroundImage = 'none';
            heroSection.style.backgroundColor = '#000';
        } else if (heroBgType === 'image' && cfg.heroBgImage) {
            heroVideo.style.display = 'none';
            heroVideo.pause();
            heroOverlay.style.display = 'block';
            if (cfg.heroBgImage.startsWith('idb://')) {
                const key = cfg.heroBgImage.replace('idb://', '');
                getMediaItem(key).then(blob => {
                    if (blob) {
                        const url = (typeof blob === 'string') ? blob : URL.createObjectURL(blob);
                        heroSection.style.backgroundImage = `url("${url}")`;
                    }
                });
            } else {
                heroSection.style.backgroundImage = `url("${cfg.heroBgImage}")`;
            }
            heroSection.style.backgroundSize = mediaFit;
            heroSection.style.backgroundPosition = mediaPosition;
        } else {
            heroVideo.style.display = 'none';
            heroVideo.pause();
            heroOverlay.style.display = 'none';
            heroSection.style.backgroundImage = 'none';
            heroSection.style.background = `linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, ${cfg.primaryColor || '#fa7b17'} 100%)`;
        }

        // Hero Badge
        const badgeTextEl = document.getElementById('heroBadgeText');
        if (badgeTextEl && cfg.heroBadgeText) {
            badgeTextEl.textContent = cfg.heroBadgeText;
        } else if (cfg.heroBadgeText) {
            const heroBadge = document.querySelector('.hero-badge');
            if (heroBadge) heroBadge.innerHTML = `<span class="dot"></span> ${cfg.heroBadgeText}`;
        }

        // Hero Main Title & Highlight Word
        const mainTitleEl = document.getElementById('heroMainTitle');
        if (mainTitleEl && (cfg.heroHeadline || cfg.heroHighlight)) {
            const hLine = cfg.heroHeadline || 'Buy, Sell & Find Anything';
            const hLight = cfg.heroHighlight || 'Near You';
            mainTitleEl.innerHTML = `${hLine}<br><span id="heroHighlightText" style="color:${cfg.primaryColor || '#fb923c'};">${hLight}</span>`;
        } else if (cfg.heroHeadline) {
            const heroTitle = document.querySelector('.hero-section h1, h1.display-5');
            if (heroTitle) heroTitle.textContent = cfg.heroHeadline;
        }

        // Hero Subtitle
        const subTitleEl = document.getElementById('heroSubtitleText') || document.querySelector('.hero-section p.lead, p.hero-subtitle');
        if (subTitleEl && cfg.heroSubtitle) {
            subTitleEl.textContent = cfg.heroSubtitle;
        }

        // Search Placeholder
        if (cfg.searchPlaceholder) {
            const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="looking for"], #keywordSearch, #heroSearchInput');
            searchInputs.forEach(input => input.placeholder = cfg.searchPlaceholder);
        }

        // Hero 4-Matrix Stats
        if (cfg.stat1Num && document.getElementById('heroStat1Num')) document.getElementById('heroStat1Num').textContent = cfg.stat1Num;
        if (cfg.stat1Lbl && document.getElementById('heroStat1Lbl')) document.getElementById('heroStat1Lbl').textContent = cfg.stat1Lbl;
        if (cfg.stat2Num && document.getElementById('heroStat2Num')) document.getElementById('heroStat2Num').textContent = cfg.stat2Num;
        if (cfg.stat2Lbl && document.getElementById('heroStat2Lbl')) document.getElementById('heroStat2Lbl').textContent = cfg.stat2Lbl;
        if (cfg.stat3Num && document.getElementById('heroStat3Num')) document.getElementById('heroStat3Num').textContent = cfg.stat3Num;
        if (cfg.stat3Lbl && document.getElementById('heroStat3Lbl')) document.getElementById('heroStat3Lbl').textContent = cfg.stat3Lbl;
        if (cfg.stat4Num && document.getElementById('heroStat4Num')) document.getElementById('heroStat4Num').textContent = cfg.stat4Num;
        if (cfg.stat4Lbl && document.getElementById('heroStat4Lbl')) document.getElementById('heroStat4Lbl').textContent = cfg.stat4Lbl;

        // Fallback for stats if IDs not present
        const statsRow = document.querySelectorAll('.hero-stats > div');
        if (statsRow.length >= 4 && !document.getElementById('heroStat1Num')) {
            if (cfg.stat1Num && statsRow[0].querySelector('.hero-stat-num')) statsRow[0].querySelector('.hero-stat-num').textContent = cfg.stat1Num;
            if (cfg.stat1Lbl && statsRow[0].querySelector('.hero-stat-lbl')) statsRow[0].querySelector('.hero-stat-lbl').textContent = cfg.stat1Lbl;
            if (cfg.stat2Num && statsRow[1].querySelector('.hero-stat-num')) statsRow[1].querySelector('.hero-stat-num').textContent = cfg.stat2Num;
            if (cfg.stat2Lbl && statsRow[1].querySelector('.hero-stat-lbl')) statsRow[1].querySelector('.hero-stat-lbl').textContent = cfg.stat2Lbl;
            if (cfg.stat3Num && statsRow[2].querySelector('.hero-stat-num')) statsRow[2].querySelector('.hero-stat-num').textContent = cfg.stat3Num;
            if (cfg.stat3Lbl && statsRow[2].querySelector('.hero-stat-lbl')) statsRow[2].querySelector('.hero-stat-lbl').textContent = cfg.stat3Lbl;
            if (cfg.stat4Num && statsRow[3].querySelector('.hero-stat-num')) statsRow[3].querySelector('.hero-stat-num').textContent = cfg.stat4Num;
            if (cfg.stat4Lbl && statsRow[3].querySelector('.hero-stat-lbl')) statsRow[3].querySelector('.hero-stat-lbl').textContent = cfg.stat4Lbl;
        }
    }

    // Section Visibility Toggles
    if (cfg.toggleCategories === false) {
        const catSec = document.getElementById('categories');
        if (catSec) catSec.style.display = 'none';
    }
    if (cfg.toggleFeatured === false) {
        const featSec = document.getElementById('featured');
        if (featSec) featSec.style.display = 'none';
    }
    if (cfg.toggleRecent === false) {
        const latestSec = document.getElementById('latest');
        if (latestSec) latestSec.style.display = 'none';
    }

    // 9. Top Announcement Banner
    const existingBanner = document.getElementById('liveTopAnnouncementBanner');
    if (cfg.enableAnnouncement && cfg.announcementText) {
        if (!existingBanner) {
            const bannerDiv = document.createElement('div');
            bannerDiv.id = 'liveTopAnnouncementBanner';
            bannerDiv.style.cssText = `background-color: ${cfg.announceBg || '#0f172a'}; color: ${cfg.announceText || '#ffffff'}; padding: 8px 16px; font-size: 13px; font-weight: 500; text-align: center; position: relative; z-index: 1060; display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;`;
            bannerDiv.innerHTML = `
                <span>${cfg.announcementText}</span>
                ${cfg.announcementBtnText ? `<a href="${cfg.announcementUrl || '#'}" class="btn btn-sm py-0.5 px-2.5 fw-bold" style="background-color: ${cfg.primaryColor || '#FA7B17'}; color: #ffffff; font-size: 11px; text-decoration: none; border-radius: 4px;">${cfg.announcementBtnText}</a>` : ''}
            `;
            document.body.prepend(bannerDiv);
        }
    } else if (existingBanner) {
        existingBanner.remove();
    }

    // 10. Floating WhatsApp Button
    const existingWa = document.getElementById('liveFloatingWaBtn');
    if (cfg.enableFloatingWa !== false && cfg.contactWhatsapp) {
        if (!existingWa) {
            const cleanWa = (cfg.contactWhatsapp || '').replace(/[^0-9]/g, '');
            const waLink = document.createElement('a');
            waLink.id = 'liveFloatingWaBtn';
            waLink.href = `https://wa.me/${cleanWa}?text=Hello%20${encodeURIComponent(cfg.siteName || 'go PAGEZ')},%20I%20have%20an%20inquiry`;
            waLink.target = '_blank';
            waLink.title = 'Chat on WhatsApp';
            waLink.style.cssText = `position: fixed; bottom: 24px; right: 24px; z-index: 9990; width: 54px; height: 54px; background: #25D366; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 8px 24px rgba(37,211,102,0.4); text-decoration: none; transition: transform 0.2s;`;
            waLink.innerHTML = `<i class="fa-brands fa-whatsapp"></i>`;
            waLink.onmouseenter = () => waLink.style.transform = 'scale(1.1)';
            waLink.onmouseleave = () => waLink.style.transform = 'scale(1)';
            document.body.appendChild(waLink);
        }
    } else if (existingWa) {
        existingWa.remove();
    }

    // 11. Footer Contact & Copyright Updates
    if (cfg.footerCopyright) {
        const copyEls = document.querySelectorAll('footer p, footer .small');
        copyEls.forEach(el => {
            if (el.innerHTML && el.innerHTML.includes('©') || el.innerHTML.includes('&copy;')) {
                el.innerHTML = cfg.footerCopyright;
            }
        });
    }

    // 12. Social Link Updates
    if (cfg.socialFb) {
        const fbLinks = document.querySelectorAll('a[href*="facebook.com"]');
        fbLinks.forEach(a => a.href = cfg.socialFb);
    }
    if (cfg.socialInsta) {
        const instaLinks = document.querySelectorAll('a[href*="instagram.com"]');
        instaLinks.forEach(a => a.href = cfg.socialInsta);
    }
    if (cfg.socialYt) {
        const ytLinks = document.querySelectorAll('a[href*="youtube.com"]');
        ytLinks.forEach(a => a.href = cfg.socialYt);
    }
    if (cfg.socialTwitter) {
        const twLinks = document.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
        twLinks.forEach(a => a.href = cfg.socialTwitter);
    }

    // 13. Execute Custom JavaScript Logic safely
    if (cfg.customJs) {
        try {
            const fn = new Function(cfg.customJs);
            fn();
        } catch(e) {
            console.warn('Custom JS execution notice:', e.message);
        }
    }
}



