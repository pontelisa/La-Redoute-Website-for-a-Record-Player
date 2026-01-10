// --- DADOS DOS PRODUTOS ---
const products = [
    {
        brand: "LENCO",
        name: "Gira-discos LS-50 Cizento",
        price: 89.25,
        oldPrice: 119.00,
        discount: "-25%",
        image: "images/gira-discos-1.jpg"
    },
    {
        brand: "LENCO",
        name: "Gira-discos c/ Base de Madeira de Carvalho",
        price: 67.67,
        oldPrice: 205.06,
        discount: "-67%",
        image: "images/gira-discos-2.png",
        url: "gira-discos-3d.html"
    },
    {
        brand: "LENCO",
        name: "Gira-discos LS-50 Azul",
        price: 135.15,
        oldPrice: 159.00,
        discount: "-15%",
        image: "images/gira-discos-3.jpg"
    },
    {
        brand: "LENCO",
        name: "Gira-discos L-85 Cizento",
        price: 140.00,
        oldPrice: 280.00,
        discount: "-50%",
        image: "images/gira-discos-4.jpg"
    }
]

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MENU MOBILE ---
    const menuBtn = document.querySelector('.menu-btn')
    const categoryList = document.querySelector('.category-list')

    if (menuBtn && categoryList) {
        menuBtn.addEventListener('click', () => {
            categoryList.classList.toggle('active')
        })
    }

    // --- 2. CABEÇALHO ---
    const searchInput = document.getElementById('searchInput')
    const clearBtn = document.getElementById('clearSearch')

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '' 
            searchInput.focus()   
        })
    }

    const navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'))
            item.classList.add('active')
        })
    })

    // --- 3. RENDERIZAR GRID DE PRODUTOS ---
    const gridContainer = document.getElementById('grid-produtos')
    
    if (gridContainer) {
        gridContainer.innerHTML = ''

        products.forEach(prod => {
            const card = document.createElement('div')
            card.className = 'product-card'
            card.style.cursor = "pointer"
            
            card.addEventListener('click', () => {
                if (prod.url) {
                    window.location.href = prod.url
                } else {
                    window.location.href = 'pagenotfound.html'
                }
            })

            let priceHtml
            if (prod.oldPrice) {
                priceHtml = `
                    <span class="price-current">${prod.price.toFixed(2)} €</span>
                    <span class="price-old">${prod.oldPrice.toFixed(2)} €</span>
                `
            } else {
                priceHtml = `<span class="price-normal">${prod.price.toFixed(2)} €</span>`
            }

            let tagHtml = prod.discount ? `<div class="promo-tag">${prod.discount}</div>` : ''

            card.innerHTML = `
                <div class="p-image-box">
                    ${tagHtml}
                    <i class="fa-regular fa-heart fav-btn"></i>
                    <img src="${prod.image}" alt="${prod.name}" onerror="this.style.display='none'">
                </div>
                <div class="p-info">
                    <div class="p-brand">${prod.brand}</div>
                    <div class="p-name">${prod.name}</div>
                    <div class="p-prices">${priceHtml}</div>
                </div>
            `
            const favBtn = card.querySelector('.fav-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (favBtn.classList.contains('fa-regular')) {
                        favBtn.classList.remove('fa-regular');
                        favBtn.classList.add('fa-solid');
                        favBtn.style.color = '#E60028';
                    } else {
                        favBtn.classList.remove('fa-solid');
                        favBtn.classList.add('fa-regular');
                        favBtn.style.color = '';
                    }
                });
            }

            gridContainer.appendChild(card)
        })
    }

    // --- 4. PREENCHER DADOS NA PÁGINA DE DETALHE ---
    const detailPriceEl = document.getElementById('dynamic-price')
    
    if (detailPriceEl) {
        // Encontrar o produto que tem o link para esta página
        const currentProduct = products.find(p => p.url === 'gira-discos-3d.html')

        if (currentProduct) {
            // Atualizar Preço Atual
            detailPriceEl.textContent = `${currentProduct.price.toFixed(2)} €`
            
            // Atualizar Preço Antigo (se existir)
            const oldPriceEl = document.getElementById('dynamic-old-price')
            if (oldPriceEl && currentProduct.oldPrice) {
                oldPriceEl.textContent = `${currentProduct.oldPrice.toFixed(2)} €`
                oldPriceEl.style.display = 'block'
            } else if (oldPriceEl) {
                oldPriceEl.style.display = 'none'
            }

            // Atualizar Desconto (se existir)
            const discountEl = document.getElementById('dynamic-discount')
            if (discountEl && currentProduct.discount) {
                discountEl.textContent = currentProduct.discount
                discountEl.style.display = 'block'
            } else if (discountEl) {
                discountEl.style.display = 'none'
            }
        }
    }
})
document.addEventListener('DOMContentLoaded', () => {
    const footerHeader = document.querySelector('.footer-top-bar');
    const footerContent = document.querySelector('.footer-expandable-content');
    const footerIcon = document.querySelector('.footer-toggle-icon');

    if (footerHeader && footerContent) {
        footerHeader.addEventListener('click', () => {
            if (footerIcon) footerIcon.classList.toggle('rotate');
            if (footerContent.style.maxHeight) {
                footerContent.style.maxHeight = null;
                footerContent.classList.remove('active');
            } else {
                footerContent.classList.add('active');
                footerContent.style.maxHeight = footerContent.scrollHeight + "px";
                const duration = 600;
                const start = performance.now();

                function step(currentTime) {
                    const elapsed = currentTime - start;
                    window.scrollTo(0, document.body.scrollHeight);
                    if (elapsed < duration) {
                        requestAnimationFrame(step);
                    }
                }
                requestAnimationFrame(step);
            }
        });
    }
});

// --- 6. DESCRIÇÃO "LER MAIS" ---
document.addEventListener('DOMContentLoaded', () => {
    const btnReadMore = document.getElementById('btnReadMore');
    const descContent = document.getElementById('descContent');

    if (btnReadMore && descContent) {
        btnReadMore.addEventListener('click', () => {
            const isExpanded = descContent.classList.contains('expanded');
            const span = btnReadMore.querySelector('span');

            if (!isExpanded) {
                descContent.classList.add('expanded');
                descContent.style.maxHeight = descContent.scrollHeight + "px";
                if(span) span.innerText = "Ler menos";
                btnReadMore.classList.add('active');
                
            } else {
                descContent.classList.remove('expanded');
                descContent.style.maxHeight = null;
                if(span) span.innerText = "Ler mais";
                btnReadMore.classList.remove('active');
            }
        });
    }
});

// --- 7. LÓGICA DO CARRINHO E QUANTIDADE ---
document.addEventListener('DOMContentLoaded', () => {
    const btnAddToCart = document.getElementById('btnAddToCart');
    
    if (btnAddToCart) {
        const qtyControls = document.getElementById('qtyControls');
        const badge = document.getElementById('cartBadge');
        
        const btnMinus = btnAddToCart.querySelector('.minus');
        const btnPlus = btnAddToCart.querySelector('.plus');

        let quantity = 0;
        const updateView = () => {
            if(badge) badge.innerText = quantity;
            if (quantity === 0) {
                qtyControls.style.display = 'none';
            } else {
                qtyControls.style.display = 'flex';
            }
        };
        btnAddToCart.addEventListener('click', (e) => {
            if (e.target.closest('.qty-btn')) return;
            if (quantity === 0) {
                quantity = 1;
                updateView();
            }
        });
        if (btnMinus) {
            btnMinus.addEventListener('click', (e) => {
                e.stopPropagation();
                if (quantity > 0) {
                    quantity--;
                    updateView();
                }
            });
        }
        if (btnPlus) {
            btnPlus.addEventListener('click', (e) => {
                e.stopPropagation();
                quantity++;
                updateView();
            });
        }
    }
});

// --- 8. TOGGLE INFORMAÇÕES DE ENTREGA (COM ANIMAÇÃO) ---
document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btnToggleDelivery');
    const content = document.getElementById('deliveryContent');

    if (btnToggle && content) {
        btnToggle.addEventListener('click', () => {
            const isOpen = content.classList.contains('active');

            if (isOpen) {
                content.classList.remove('active');
                content.style.maxHeight = null;
                btnToggle.classList.remove('active');
            } else {
                content.classList.add('active');
                btnToggle.classList.add('active'); 
                content.style.maxHeight = (content.scrollHeight + 40) + "px";
            }
        });
    }
});

// --- 9. TOGGLE ENTREGA GRATUITA (NOVO) ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleFree = document.getElementById('btnFreeDeliveryToggle');

    if (toggleFree) {
        toggleFree.addEventListener('click', () => {
            // Alterna a classe 'active' que muda a cor e move a bolinha no CSS
            toggleFree.classList.toggle('active');
        });
    }
});

// --- 10. REDIRECIONAMENTO PARA PÁGINA DE ERRO (LINKS SEM FUNCIONALIDADE) ---
document.addEventListener('DOMContentLoaded', () => {
    const redirectTo404 = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'pagenotfound.html';
    };
    const deadLinks = document.querySelectorAll('a[href="#"]');
    deadLinks.forEach(link => link.addEventListener('click', redirectTo404));

    const navTabs = document.querySelectorAll('.nav-item');
    navTabs.forEach(tab => tab.addEventListener('click', redirectTo404));
    const headerIcons = document.querySelectorAll('.right-icons .icon-large');
    headerIcons.forEach(icon => icon.addEventListener('click', redirectTo404));
    const buyNowBtn = document.querySelector('.buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', redirectTo404);
    }
    const appButtons = document.querySelectorAll('.app-badges button');
    appButtons.forEach(btn => btn.addEventListener('click', redirectTo404));
    const legalLinks = document.querySelectorAll('.legal-links span');
    legalLinks.forEach(link => link.addEventListener('click', redirectTo404));
    const footerIcons = document.querySelectorAll('.payment-icons i, .social-icons i');
    footerIcons.forEach(icon => icon.addEventListener('click', redirectTo404));
});