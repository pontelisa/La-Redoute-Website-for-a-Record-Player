import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

let cena = new THREE.Scene()
cena.background = new THREE.Color("#f4f6f7") 

let luzPrincipal, luzAmbiente;
let indiceAmbiente = 1;
let objetoMesa = null;

let timerAutoRodar = null;
let isResetting = false;

let pausaAnimacao = false;
let pausaRotacao = false

const posicaoInicial = new THREE.Vector3(4, 3, 5);
const alvoInicial = new THREE.Vector3(0, 0, 0);

let misturador = null
let girarDiscoAction = null
let colocarAgulhaAction = null
let retirarAgulhaAction = null
let abrirTampaAction = null
let fecharTampaAction = null
let girarDisco = false
let agulhaNoDisco = false
let tampaFechada = false

let objetoBase = null
let texturasBase = []
let indiceTexturaBase = 0
let propsBaseOriginal = null

let isUIHidden = false;

let agulhaPosicionada = false;

const audioSom = new Audio('sounds/sound1.mp3');
audioSom.loop = true;
const INITIAL_VOLUME = 0.05;
audioSom.volume = INITIAL_VOLUME;
let isMuted = false;
let previousVolume = INITIAL_VOLUME;

let camara = new THREE.PerspectiveCamera(10, 800/600, 0.1, 1000)
camara.position.set(4, 3, 5)

let meuCanvas = document.getElementById('meuCanvas')
let renderer = new THREE.WebGLRenderer({canvas: meuCanvas, antialias: true})

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(meuCanvas.clientWidth, meuCanvas.clientHeight)

let controlos = new OrbitControls(camara, renderer.domElement)
controlos.enableDamping = true
controlos.dampingFactor = 0.05
controlos.minDistance = 2
controlos.maxDistance = 10

controlos.autoRotate = true;
controlos.autoRotateSpeed = 2.0;

function interagirComObjeto() {
    if (pausaRotacao) return;

    controlos.autoRotate = false;
    isResetting = false;

    clearTimeout(timerAutoRodar);

    timerAutoRodar = setTimeout(function() {
        if (!pausaRotacao) {
            isResetting = true;
        }
    }, 5000);
}

controlos.addEventListener('start', function() {
    if (pausaRotacao) return;
    clearTimeout(timerAutoRodar);
    controlos.autoRotate = false;
    isResetting = false;
});

controlos.addEventListener('end', function() {
    interagirComObjeto()
});

function configurarLuzes() {
    // Luz Ambiente Base
    luzAmbiente = new THREE.AmbientLight(0x404040, 2); 
    cena.add(luzAmbiente);

    // Luz Principal (Spotlight para gerar sombras)
    luzPrincipal = new THREE.DirectionalLight(0xffffff, 2);
    luzPrincipal.position.set(2, 5, 2);
    luzPrincipal.castShadow = true;
    luzPrincipal.shadow.mapSize.width = 1024;
    luzPrincipal.shadow.mapSize.height = 1024;
    cena.add(luzPrincipal);
}
configurarLuzes();

function isActionBusy(action) {
    if (!action) return false
    if (!action.isRunning() && !action.paused) return false
    const duration = action.getClip().duration
    if (action.time >= duration) return false 
    return true
}

function isAnyAnimationRunning() {
    return isActionBusy(colocarAgulhaAction) || isActionBusy(retirarAgulhaAction) || isActionBusy(abrirTampaAction) || isActionBusy(fecharTampaAction)
}

function isActionActive(action) {
    return action && (action.isRunning() || action.paused || action.time > 0)
}

const textureLoader = new THREE.TextureLoader();

const textura_2 = textureLoader.load('blender_files/RecordPlayer/Textura_2.jpg');
textura_2.flipY = false;
textura_2.encoding = THREE.sRGBEncoding;

const textura_3 = textureLoader.load('blender_files/RecordPlayer/Textura_3.jpg');
textura_3.flipY = false;
textura_3.encoding = THREE.sRGBEncoding;

let carregador = new GLTFLoader()

carregador.load(
    'blender_files/RecordPlayer/RecordPlayer.gltf',
    function(gltf) {
        const modeloGiraDiscos = gltf.scene;
        modeloGiraDiscos.position.y = -0.10; // Ajuste de altura
        cena.add(modeloGiraDiscos);

        misturador = new THREE.AnimationMixer(modeloGiraDiscos);

        misturador.addEventListener('finished', function(e) {
            if(e.action === girarDiscoAction) return;

            if (e.action === colocarAgulhaAction) {
                agulhaPosicionada = true;
                atualizarEstadoAudio();
            }
            interagirComObjeto();
        });

        modeloGiraDiscos.traverse(function (node) {
            if (node.isMesh) {
                if (node.material && node.material.map) {
                    node.material.side = THREE.DoubleSide; 
                    node.material.alphaTest = 0.5; 
                    node.material.transparent = false; 
                }

                if (node.name === 'Base') {
                    objetoBase = node;
                    propsBaseOriginal = {
                        map: node.material.map,
                        roughness: node.material.roughness,
                        metalness: node.material.metalness,
                        color: node.material.color.clone()
                    };
                    texturasBase = [propsBaseOriginal.map, textura_2, textura_3, null, null];
                }
            }
        });

        let clipGirarDisco = THREE.AnimationClip.findByName(gltf.animations, 'GirarDisco')
        if (clipGirarDisco) girarDiscoAction = misturador.clipAction(clipGirarDisco)
        
        let clipColocarAgulha = THREE.AnimationClip.findByName(gltf.animations, 'ColocarAgulha')
        if (clipColocarAgulha) {
            colocarAgulhaAction = misturador.clipAction(clipColocarAgulha)
            colocarAgulhaAction.loop = THREE.LoopOnce 
            colocarAgulhaAction.clampWhenFinished = true 
        }

        let clipRetirarAgulha = THREE.AnimationClip.findByName(gltf.animations, 'RetirarAgulha')
        if (clipRetirarAgulha) {
            retirarAgulhaAction = misturador.clipAction(clipRetirarAgulha)
            retirarAgulhaAction.loop = THREE.LoopOnce 
            retirarAgulhaAction.clampWhenFinished = true
        }

        let clipFecharTampa = THREE.AnimationClip.findByName(gltf.animations, 'FecharTampa')
        if (clipFecharTampa) {
            fecharTampaAction = misturador.clipAction(clipFecharTampa)
            fecharTampaAction.loop = THREE.LoopOnce 
            fecharTampaAction.clampWhenFinished = true
        }

        let clipAbrirTampa = THREE.AnimationClip.findByName(gltf.animations, 'AbrirTampa')
        if (clipAbrirTampa) {
            abrirTampaAction = misturador.clipAction(clipAbrirTampa)
            abrirTampaAction.loop = THREE.LoopOnce 
            abrirTampaAction.clampWhenFinished = true
        }
        
        aplicarAmbiente(1);
    },
    undefined,
    function(error) { console.error('Erro GLTF:', error) }
)

carregador.load(
    'blender_files/Mesa/Mesa.gltf',
    function(gltf) {
        objetoMesa = gltf.scene;
        objetoMesa.position.y = -0.10; 
        objetoMesa.visible = false; 

        objetoMesa.traverse(function (node) {
            if (node.isMesh) {
                if(node.material) {
                    node.material.side = THREE.DoubleSide;
                    node.material.metalness = 0.1; 
                    node.material.roughness = 0.8;
                }
            }
        });

        cena.add(objetoMesa);

    },
    undefined,
    function(error) { console.error('Erro ao carregar Mesa:', error) }
)

function aplicarAmbiente(numero) {
    if (numero === 1) {
        // Fundo 1 (Cinza/Estúdio): Luz Branca Neutra
        textureLoader.load('images/fundo1.jpg', function(texture) {
            cena.background = texture;
        });
        luzPrincipal.color.setHex(0xffffff);
        luzPrincipal.intensity = 2;
        luzAmbiente.color.setHex(0x404040);
        luzAmbiente.intensity = 1.5;

    } else if (numero === 2) {
        // Fundo 2 (Sala Clara): Luz Quente/Solar
        textureLoader.load('images/fundo2.jpg', function(texture) {
            cena.background = texture;
        });
        luzPrincipal.color.setHex(0xffecc7); // Tom amarelado
        luzPrincipal.intensity = 2.5;
        luzAmbiente.color.setHex(0xffffff);
        luzAmbiente.intensity = 1.0;

    } else if (numero === 3) {
        // Fundo 3 (Quarto Neon): Luz Laranja/Escura
        textureLoader.load('images/fundo3.jpg', function(texture) {
            cena.background = texture;
        });
        luzPrincipal.color.setHex(0xffaa00); // Tom Laranja forte
        luzPrincipal.intensity = 3;
        luzAmbiente.color.setHex(0x000000); // Ambiente escuro
        luzAmbiente.intensity = 0.5;
    }
}

window.navegarAmbiente = function(direcao) {
    indiceAmbiente += direcao;
    // Ciclo 1 -> 2 -> 3 -> 1
    if (indiceAmbiente > 3) indiceAmbiente = 1; 
    if (indiceAmbiente < 1) indiceAmbiente = 3;
    
    aplicarAmbiente(indiceAmbiente);
}

window.onWindowResize = function() {
    const parent = meuCanvas.parentElement
    if (parent) {
        camara.aspect = parent.clientWidth / parent.clientHeight
        camara.updateProjectionMatrix()
        renderer.setSize(parent.clientWidth, parent.clientHeight)
    }
}

function atualizarEstadoAudio() {
    if (girarDisco && agulhaPosicionada && !pausaAnimacao) {
        audioSom.play().catch(e => console.warn("Interaja com o site primeiro.", e));
    } else {
        audioSom.pause();
    }
}

function configurarEventos() {
    const btnCleanView = document.getElementById('btn_clean_view');
    
    if (btnCleanView) {
        btnCleanView.onclick = function() {
            isUIHidden = !isUIHidden;
            btnCleanView.classList.toggle('active');
            const icon = btnCleanView.querySelector('i');
            if (icon) {
                if (isUIHidden) {
                    icon.className = "fa-regular fa-eye-slash";
                    btnCleanView.setAttribute('data-tooltip', 'Mostrar Botões');
                    const tooltip = document.getElementById('custom-tooltip');
                    if (tooltip) tooltip.innerText = 'Mostrar Botões';
                } else {
                    icon.className = "fa-regular fa-eye";
                    btnCleanView.setAttribute('data-tooltip', 'Ocultar Botões');
                    const tooltip = document.getElementById('custom-tooltip');
                    if (tooltip) tooltip.innerText = 'Ocultar Botões';
                }
            }
            gerirPosicao3D(); 
        }
    }

    const btnMesa = document.getElementById('btn_mesa_toggle');
    if (btnMesa) {
        btnMesa.onclick = function() {
            if (objetoMesa) {
                objetoMesa.visible = !objetoMesa.visible;
                if(objetoMesa.visible) {
                    btnMesa.classList.add('active');
                    btnMesa.setAttribute('data-tooltip', 'Ocultar Mesa');
                    const tooltip = document.getElementById('custom-tooltip');
                    if (tooltip) tooltip.innerText = 'Ocultar Mesa';
                } else {
                    btnMesa.classList.remove('active');
                    btnMesa.setAttribute('data-tooltip', 'Mostrar Mesa');
                    const tooltip = document.getElementById('custom-tooltip');
                    if (tooltip) tooltip.innerText = 'Mostrar Mesa';
                }
            }
        }
    }

    const btnMaterial = document.getElementById('btn_mudar_base');
    if (btnMaterial) {
        btnMaterial.onclick = function() {
            if (objetoBase && texturasBase.length > 0) {
                interagirComObjeto();
                indiceTexturaBase++;
                if (indiceTexturaBase >= texturasBase.length) {
                    indiceTexturaBase = 0;
                }
                objetoBase.material.map = texturasBase[indiceTexturaBase];
                if (indiceTexturaBase === 1) {
                    objetoBase.material.roughness = 0.2; 
                    objetoBase.material.metalness = 0.1;
                    objetoBase.material.color.setHex(0xbbbbbb);

                } else if (indiceTexturaBase === 2) {
                    objetoBase.material.roughness = 0.4;
                    objetoBase.material.metalness = 0.9
                    objetoBase.material.color.setHex(0xffffff);

                } else if (indiceTexturaBase === 3) {
                    objetoBase.material.roughness = 0.4;
                    objetoBase.material.metalness = 0.1;
                    objetoBase.material.color.setHex(0x610000);

                } else if (indiceTexturaBase === 4) {
                    objetoBase.material.roughness = 0.4;
                    objetoBase.material.metalness = 0.1;
                    objetoBase.material.color.setHex(0x560061);

                } else {
                    if (propsBaseOriginal) {
                        objetoBase.material.roughness = propsBaseOriginal.roughness;
                        objetoBase.material.metalness = propsBaseOriginal.metalness;
                        objetoBase.material.color.copy(propsBaseOriginal.color);
                    }
                }
                objetoBase.material.needsUpdate = true;
            }
        }
    }

    const btnTogglePanel = document.getElementById('btn_toggle_panel');
    const controlsPanel = document.getElementById('controls-3d-panel');
    
    if (btnTogglePanel && controlsPanel) {
        btnTogglePanel.onclick = function() {
            controlsPanel.classList.toggle('minimized');
            const icon = btnTogglePanel.querySelector('i');
            if (icon) {
                if (controlsPanel.classList.contains('minimized')) {
                    icon.className = 'fa-solid fa-chevron-up'; // Seta para cima quando fechado
                } else {
                    icon.className = 'fa-solid fa-chevron-down'; // Seta para baixo quando aberto
                }
            }
        }
    }

    const btnVolume = document.getElementById('btn_volume');
    const volumeSlider = document.getElementById('volume_slider');
    const updateVolumeIcon = () => {
        if (!btnVolume) return;
        const icon = btnVolume.querySelector('i');
        if (!icon) return;
        
        if (audioSom.muted || audioSom.volume === 0) {
            icon.className = 'fa-solid fa-volume-xmark';
            btnVolume.setAttribute('data-tooltip', 'Dessilenciar Música');
            const tooltip = document.getElementById('custom-tooltip');
            if (tooltip) tooltip.innerText = 'Dessilenciar Música';
        } else {
            icon.className = 'fa-solid fa-volume-high';
            btnVolume.setAttribute('data-tooltip', 'Silenciar Música');
            const tooltip = document.getElementById('custom-tooltip');
            if (tooltip) tooltip.innerText = 'Silenciar Música';
        }
    };
    const updateSliderVisual = (val) => {
        if (!volumeSlider) return;
        const percentage = val * 100;
        volumeSlider.style.backgroundSize = `${percentage}% 100%`;
    }
    if (volumeSlider) {
        volumeSlider.value = INITIAL_VOLUME;
        updateSliderVisual(INITIAL_VOLUME);
    }
    if (btnVolume && volumeSlider) {
        btnVolume.onclick = function() {
            if (audioSom.volume > 0 && !audioSom.muted) {
                audioSom.muted = true;
                volumeSlider.value = 0;
                updateSliderVisual(0);
            } else {
                audioSom.muted = false;
                audioSom.volume = previousVolume > 0 ? previousVolume : INITIAL_VOLUME;
                volumeSlider.value = audioSom.volume;
                updateSliderVisual(audioSom.volume);
            }
            updateVolumeIcon();
        }

        volumeSlider.oninput = function() {
            const val = parseFloat(this.value);
            audioSom.volume = val;
            audioSom.muted = (val === 0);
            
            if (val > 0) previousVolume = val;
            updateVolumeIcon();
            updateSliderVisual(val);
        }
    }

    const btnGirar = document.getElementById('btn_girarDisco')
    if(btnGirar) btnGirar.onclick = function() {
        if (pausaAnimacao) return; 
        interagirComObjeto()
        if (isAnyAnimationRunning() || agulhaNoDisco === true || tampaFechada === true) return
        if (girarDisco) {
            if (girarDiscoAction) {
                girarDiscoAction.paused = true;
            }
            girarDisco = false;
            btnGirar.innerText = "Girar Disco";
            btnGirar.setAttribute('data-tooltip', 'Colocar o Disco a Girar');
            const tooltip = document.getElementById('custom-tooltip');
            if (tooltip) tooltip.innerText = 'Colocar o Disco a Girar';
        } else {
            if (girarDiscoAction) { 
                girarDiscoAction.enabled = true; 
                if (!girarDiscoAction.isRunning()) {
                    girarDiscoAction.play();
                }
                girarDiscoAction.paused = false; 
            }

            girarDisco = true;
            btnGirar.innerText = "Parar Disco";
            btnGirar.setAttribute('data-tooltip', 'Parar o Movimento do Disco');
            const tooltip = document.getElementById('custom-tooltip');
            if (tooltip) tooltip.innerText = 'Parar o Movimento do Disco';
        }
        atualizarEstadoAudio();
    }

    const btnToggleAgulha = document.getElementById('btn_toggleAgulha')
    if (btnToggleAgulha) btnToggleAgulha.onclick = function() {
        if (pausaAnimacao) return;
        interagirComObjeto();

        if (isAnyAnimationRunning() || tampaFechada === true) return

        if (agulhaNoDisco) {
            if (retirarAgulhaAction) {
                if (colocarAgulhaAction) { colocarAgulhaAction.stop(); colocarAgulhaAction.reset(); }
                retirarAgulhaAction.enabled = true; retirarAgulhaAction.reset(); retirarAgulhaAction.play();
                agulhaNoDisco = false;
                agulhaPosicionada = false;
                btnToggleAgulha.innerText = "Colocar Agulha";
                btnToggleAgulha.setAttribute('data-tooltip', 'Mover a Agulha para o Disco');
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Mover a Agulha para o Disco';
            }
        } else {
            if (colocarAgulhaAction) {
                if (retirarAgulhaAction) { retirarAgulhaAction.stop(); retirarAgulhaAction.reset(); }
                colocarAgulhaAction.enabled = true; colocarAgulhaAction.reset(); colocarAgulhaAction.play();
                agulhaNoDisco = true;
                agulhaPosicionada = false
                btnToggleAgulha.innerText = "Retirar Agulha";
                btnToggleAgulha.setAttribute('data-tooltip', 'Retirar a Agulha do Disco');
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Retirar a Agulha do Disco';
            }
        }
        atualizarEstadoAudio();
    }

    const btnToggleTampa = document.getElementById('btn_toggleTampa')
    if (btnToggleTampa) btnToggleTampa.onclick = function() {
        if (pausaAnimacao) return;
        interagirComObjeto();
        if (isAnyAnimationRunning()) return;
        if (tampaFechada) {
            if (abrirTampaAction) {
                if (fecharTampaAction) { fecharTampaAction.stop(); fecharTampaAction.reset(); }
                abrirTampaAction.enabled = true; abrirTampaAction.reset(); abrirTampaAction.play();
                tampaFechada = false;
                btnToggleTampa.innerText = "Fechar Tampa";
                btnToggleTampa.setAttribute('data-tooltip', 'Fechar a Tampa de Proteção');
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Fechar a Tampa de Proteção';
            }
        } else {
            if (fecharTampaAction) {
                if (abrirTampaAction) { abrirTampaAction.stop(); abrirTampaAction.reset(); }
                fecharTampaAction.enabled = true; fecharTampaAction.reset(); fecharTampaAction.play();
                tampaFechada = true;
                btnToggleTampa.innerText = "Abrir Tampa";
                btnToggleTampa.setAttribute('data-tooltip', 'Abrir a Tampa de Proteção');
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Abrir a Tampa de Proteção';
            }
        }
    }

    const btnReset = document.getElementById('btn_reset')
    if(btnReset) btnReset.onclick = function() {
        if (girarDiscoAction) { girarDiscoAction.stop(); girarDiscoAction.reset(); }
        if (colocarAgulhaAction) { colocarAgulhaAction.stop(); colocarAgulhaAction.reset(); }
        if (retirarAgulhaAction) { retirarAgulhaAction.stop(); retirarAgulhaAction.reset(); }
        if (abrirTampaAction) { abrirTampaAction.stop(); abrirTampaAction.reset(); }
        if (fecharTampaAction) { fecharTampaAction.stop(); fecharTampaAction.reset(); }
        agulhaNoDisco = false; tampaFechada = false; girarDisco = false;
        agulhaPosicionada = false;

        audioSom.pause()
        audioSom.currentTime = 0
        audioSom.muted = false;
        audioSom.volume = INITIAL_VOLUME;
        previousVolume = INITIAL_VOLUME;

        if (volumeSlider) {
            volumeSlider.value = INITIAL_VOLUME;
            updateSliderVisual(INITIAL_VOLUME);
        }
        updateVolumeIcon();

        if(btnGirar) {
            btnGirar.innerText = "Girar Disco";
            btnGirar.setAttribute('data-tooltip', 'Colocar o Disco a Girar');
        }
        if(btnToggleAgulha) {
            btnToggleAgulha.innerText = "Colocar Agulha";
            btnToggleAgulha.setAttribute('data-tooltip', 'Mover a Agulha para o Disco');
        }
        if(btnToggleTampa) {
            btnToggleTampa.innerText = "Fechar Tampa";
            btnToggleTampa.setAttribute('data-tooltip', 'Fechar a Tampa de Proteção');
        }

        pausaAnimacao = false;
        pausaRotacao = false;

        const iconAnim = document.querySelector('#btn_pause_anim i');
        if(iconAnim) iconAnim.className = 'fa-solid fa-pause';

        const iconRot = document.querySelector('#btn_pause_rot i');
        if(iconRot) iconRot.className = 'fa-solid fa-arrows-rotate';

        if (objetoBase && texturasBase.length > 0) {
            indiceTexturaBase = 0;
            objetoBase.material.map = texturasBase[0];
            if (propsBaseOriginal) {
                objetoBase.material.roughness = propsBaseOriginal.roughness;
                objetoBase.material.metalness = propsBaseOriginal.metalness;
                objetoBase.material.color.copy(propsBaseOriginal.color);
            }
            objetoBase.material.needsUpdate = true;
        }

        clearTimeout(timerAutoRodar);
        isResetting = false;

        controlos.autoRotate = false;
        controlos.enableDamping = false;
        controlos.update()
        controlos.reset()
        controlos.enableDamping = true

        timerAutoRodar = setTimeout(function() {
            if(!pausaRotacao) {
                controlos.autoRotate = true;
            }
        }, 5000);
    }

    const btnPauseAnim = document.getElementById('btn_pause_anim')
    if(btnPauseAnim) btnPauseAnim.onclick = function() {
        pausaAnimacao = !pausaAnimacao;
        interagirComObjeto();

        const icon = btnPauseAnim.querySelector('i');
        if (icon) {
            if (pausaAnimacao) {
                icon.className = 'fa-solid fa-play';
                btnPauseAnim.setAttribute('data-tooltip', 'Retomar Animações'); 
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Retomar Animações';
            } else {
                icon.className = 'fa-solid fa-pause';
                btnPauseAnim.setAttribute('data-tooltip', 'Pausar Animações'); 
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Pausar Animações';
            }
        }

        const toggleAction = (action) => {
            if (isActionActive(action)) action.paused = pausaAnimacao;
        }

        if (girarDiscoAction) {
            if (pausaAnimacao) {
                girarDiscoAction.paused = true;
            } else {
                if (girarDisco) {
                    girarDiscoAction.paused = false;
                } else {
                    girarDiscoAction.paused = true;
                }
            }
        }

        toggleAction(colocarAgulhaAction);
        toggleAction(retirarAgulhaAction);
        toggleAction(abrirTampaAction);
        toggleAction(fecharTampaAction);

        atualizarEstadoAudio();
    }

    const btnPauseRot = document.getElementById('btn_pause_rot')
    if(btnPauseRot) btnPauseRot.onclick = function() {
        pausaRotacao = !pausaRotacao;

        const icon = btnPauseRot.querySelector('i');
        if (icon) {
            if (pausaRotacao) {
                icon.className = 'fa-solid fa-ban'; 
                btnPauseRot.setAttribute('data-tooltip', 'Pausar Rotação'); 
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Retomar Rotação';
            } else {
                icon.className = 'fa-solid fa-arrows-rotate';
                btnPauseRot.setAttribute('data-tooltip', 'Retomar Rotação'); 
                const tooltip = document.getElementById('custom-tooltip');
                if (tooltip) tooltip.innerText = 'Pausar Rotação';
            }
        }

        if (pausaRotacao) {
            controlos.autoRotate = false;
            isResetting = false;
            clearTimeout(timerAutoRodar);
        } else {
            controlos.autoRotate = true;
        }
    }
    
    window.addEventListener('resize', onWindowResize, false)
}

function configurarTooltips() {
    const tooltip = document.getElementById('custom-tooltip');
    const elements = document.querySelectorAll('[data-tooltip]');

    if (!tooltip) return;

    elements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const text = el.getAttribute('data-tooltip');
            if (!text) return;
            tooltip.innerText = text;
            tooltip.classList.add('visible');
            const rect = el.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            let top = rect.top - tooltipRect.height - 10;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            if (top < 0) top = rect.bottom + 10; 
            if (left < 0) left = 10;
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        });
        el.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });
}

function luzes(cena) {
    let luz = new THREE.PointLight('white', 100)
    luz.position.set(3, 4, 0)
    cena.add(luz)
    let luzAmbiente = new THREE.AmbientLight(0x404040, 2) 
    cena.add(luzAmbiente)
}

let delta = 0
let relogio = new THREE.Clock()
let latencia_minima = 1/60

function animar() {
    requestAnimationFrame(animar)
    if (isResetting) {
        camara.position.lerp(posicaoInicial, 0.01);
        controlos.target.lerp(alvoInicial, 0.01);
        if (camara.position.distanceTo(posicaoInicial) < 0.01 && 
            controlos.target.distanceTo(alvoInicial) < 0.01) {
            
            isResetting = false;
            controlos.autoRotate = true;
        }
    }
    controlos.update()
    delta += relogio.getDelta()
    if (delta < latencia_minima) return 
    const latenciaDiscreta = Math.floor(delta/latencia_minima) * latencia_minima
    if (misturador) misturador.update(latenciaDiscreta)
    delta = delta % latencia_minima
    renderer.render(cena, camara)
}

luzes(cena)
configurarEventos()
configurarTooltips()
animar()

// ====================================================================
// LÓGICA DA GALERIA E MODAL
// ====================================================================


let isModalOpen = false;

function gerirPosicao3D() {
    const view3d = document.getElementById('view-3d');
    const controlsPanel = document.getElementById('controls-3d-panel');
    const topLeftControls = document.getElementById('top-left-panel');
    const topCenterControls = document.getElementById('top-center-panel');
    const topRightControls = document.getElementById('top-right-panel');
    const btnCleanView = document.getElementById('btn_clean_view');

    const mainSlide3d = document.getElementById('slide-3d-wrapper');
    const mainDisplayArea = document.getElementById('main-display-area');
    const modalSlide3d = document.getElementById('modal-slide-3d');
    const modalDisplayArea = document.getElementById('modal-display-area');

    if (isModalOpen) {
        if (view3d && modalSlide3d) modalSlide3d.appendChild(view3d);
        if (controlsPanel && modalDisplayArea) {
            modalDisplayArea.appendChild(controlsPanel);
            controlsPanel.classList.add('overlay-mode');
            controlsPanel.classList.remove('block-mode');
        }

        if (topLeftControls && modalDisplayArea) {
            modalDisplayArea.appendChild(topLeftControls);
        }
        if (topCenterControls && modalDisplayArea) {
            modalDisplayArea.appendChild(topCenterControls);
        }
        if (topRightControls && modalDisplayArea) {
            modalDisplayArea.appendChild(topRightControls);
        }

        if (btnCleanView && modalDisplayArea) {
            modalDisplayArea.appendChild(btnCleanView);
        }

        if (isUIHidden) {
            modalDisplayArea.classList.add('ui-hidden');
            mainDisplayArea.classList.remove('ui-hidden');
        } else {
            modalDisplayArea.classList.remove('ui-hidden');
        }

    } else {
        // --- MODO NORMAL ---
        if (view3d && mainSlide3d) mainSlide3d.appendChild(view3d);
        if (controlsPanel && mainDisplayArea) {
            mainDisplayArea.appendChild(controlsPanel);
            controlsPanel.classList.add('overlay-mode');
            controlsPanel.classList.remove('block-mode');
        }
        if (topLeftControls && mainDisplayArea) {
            mainDisplayArea.appendChild(topLeftControls);
        }
        if (topCenterControls && mainDisplayArea) {
            mainDisplayArea.appendChild(topCenterControls);
        }
        if (topRightControls && mainDisplayArea) {
            mainDisplayArea.appendChild(topRightControls);
        }
        if (btnCleanView && mainDisplayArea) {
            mainDisplayArea.appendChild(btnCleanView);
        }

        // Aplicar estado oculto se necessário
        if (isUIHidden) {
            mainDisplayArea.classList.add('ui-hidden');
            modalDisplayArea.classList.remove('ui-hidden');
        } else {
            mainDisplayArea.classList.remove('ui-hidden');
        }
    }
    setTimeout(window.onWindowResize, 50);
}

window.abrirPopup = function() {
    isModalOpen = true;
    document.getElementById("imageModal").style.display = "block";
    gerirPosicao3D();
}

window.fecharPopup = function() {
    isModalOpen = false;
    document.getElementById("imageModal").style.display = "none";
    gerirPosicao3D();
}

document.addEventListener('keydown', function(event) {
    if (event.key === "Escape" && isModalOpen) window.fecharPopup();
    
    // Setas do teclado também mudam o ambiente
    if (event.key === "ArrowRight") window.navegarAmbiente(1);
    if (event.key === "ArrowLeft") window.navegarAmbiente(-1);
});

window.onclick = function(event) {
    const modal = document.getElementById("imageModal");
    if (event.target == modal || event.target.classList.contains('modal-body-wrapper')) {
        window.fecharPopup();
    }
}