// Ideotipo
let morfologias = [];
let eje_OrigenX = 256;
let eje_OrigenY = 256;
let grosor_Resistencia = 12;
let ciclo_Activo = true;
let hojas = [];
let hojas_Activadas = false;
let hojas_Por_Elemento = 5;


class ElementoVital {
    constructor(pos, angulo, ancho, tipo) {
        this.pos = pos;
        this.angulo = angulo;
        this.ancho = ancho;
        this.tipo = tipo;
        this.historial = [pos.copy()];
        this.trayectoria = 0;
        this.umbral_Division = random(20, 50);
        this.terminado = false;
    }

    expandir() {
        if (this.ancho < 1 || this.terminado) {
            this.terminado = true;
            return;
        }

        let velocidad_Base = 1.0;
        let factor_Caos = 0.1;
        let fuerza_Nostalgia = 0.02;

        this.angulo += random(-factor_Caos, factor_Caos);

        if (this.tipo === "Experiencia") {
            if (this.angulo > 0) this.angulo -= fuerza_Nostalgia;
            if (this.angulo < -PI) this.angulo += fuerza_Nostalgia;
        } else {
            if (this.angulo < 0) this.angulo += fuerza_Nostalgia;
            if (this.angulo > PI) this.angulo -= fuerza_Nostalgia;
        }

        let avance_x = cos(this.angulo) * velocidad_Base;
        let avance_y = sin(this.angulo) * velocidad_Base;

        this.pos.x += avance_x;
        this.pos.y += avance_y;
        this.historial.push(this.pos.copy());
        this.trayectoria++;

        this.ancho *= 0.996;

        if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
            this.terminado = true;
        }
    }

   trazar() {
        if (this.historial.length < 2) return; 

        noFill();
        strokeWeight(this.ancho);

        let opacidad_Inicio = 200; 
        let opacidad_Final = 10;   
        
        let longitud_Rama = this.historial.length;


        for (let i = 0; i < longitud_Rama - 1; i++) {
            let p1 = this.historial[i];
            let p2 = this.historial[i + 1];

           let opacidad_segmento = map(
                i, 
                0, 
                longitud_Rama - 1, 
                opacidad_Inicio, 
                opacidad_Final
            );
        
            opacidad_segmento = constrain(opacidad_segmento, opacidad_Final, opacidad_Inicio);
            
            stroke(255, 255, 255, opacidad_segmento);

            line(p1.x, p1.y, p2.x, p2.y);
        }
    }

    dividir() {
        let nuevos_Elementos = [];
        let numDivisiones = floor(random(1, 3));

        for (let i = 0; i < numDivisiones; i++) {
            let anguloDivision = random(-PI / 3, PI / 3);
            let nuevoAngulo = this.angulo + anguloDivision;
            let nuevoAncho = this.ancho * random(0.5, 0.7);

            nuevos_Elementos.push(
                new ElementoVital(this.pos.copy(), nuevoAngulo, nuevoAncho, this.tipo)
            );
        }
        this.terminado = true;
        return nuevos_Elementos;
    }
}


class Hoja {
    // [Cuerpo de Hoja sin cambios]
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.origenX = x; 
        this.initialAngle = random(0, 360);
        this.angularSpeed = random(1, 3);
        this.radius = random(5, 15);
        this.velY = random(0.5, 1.5);
        this.accY = 0.05;
        this.alpha = 255;
        this.tamano = random(2, 4);
        this.piso = height / 2;
    }

    actualizar() {
        this.velY += this.accY;
        this.velY = constrain(this.velY, 0.5, 3);

        this.pos.y += this.velY;

        let time = frameCount / 60;
        let angle = this.initialAngle + this.angularSpeed * time;

        this.pos.x = this.origenX + this.radius * sin(angle);

        if (this.pos.y >= this.piso) {
            this.velY *= 0.8;
            this.radius *= 0.9;
            this.alpha -= 8;
        } else {
            this.alpha -= 0.5;
        }
    }

    trazar() {
        noStroke();
        fill(255, this.alpha);
        ellipse(this.pos.x, this.pos.y, this.tamano, this.tamano);
    }

    estaMuerta() {
        return this.alpha <= 0;
    }
}



function activarCaidaDeHojas() {
        let ramas_Activas = morfologias.filter(elemento => 
        elemento.tipo === "Experiencia" && 
        !elemento.terminado && 
        elemento.historial.length > 5 
    );

    
    if (ramas_Activas.length === 0) {
        return; // Salimos de la función si no hay ramas válidas.
    }

    let hojas_por_rama_activa = floor(hojas_Por_Elemento / ramas_Activas.length) || 1; // Mínimo 1 por rama

    for (let elemento of ramas_Activas) {
        let posUltima = elemento.historial[elemento.historial.length - 1];

        let x_inicial = posUltima.x;
        let y_inicial = posUltima.y;


        for (let i = 0; i < hojas_por_rama_activa; i++) {
            hojas.push(new Hoja(x_inicial, y_inicial));
        }
        
    }
    
    let totalHojasGeneradas = hojas.length;
    while (totalHojasGeneradas < hojas_Por_Elemento) {
        let rama_random = random(ramas_Activas);
        let posUltima = rama_random.historial[rama_random.historial.length - 1];
        hojas.push(new Hoja(posUltima.x, posUltima.y));
        totalHojasGeneradas++;
    }
}

function reiniciarSistema() {
    morfologias = [];
    hojas = [];
    ciclo_Activo = true;
    hojas_Activadas = false;
    background(4); 
    setup(); 
}

function setup() {
    createCanvas(512, 512);
    background(4);
    frameRate(24);

    let semillas_Iniciales = floor(random(6, 16));

    for (let i = 0; i < semillas_Iniciales; i++) {
        let angulo_Busqueda = random(-PI * 0.75, -PI * 0.25);
        morfologias.push(
            new ElementoVital(
                createVector(eje_OrigenX, eje_OrigenY),
                angulo_Busqueda,
                grosor_Resistencia,
                "Experiencia"
            )
        );

        let angulo_Memoria = random(PI * 0.25, PI * 0.75);
        morfologias.push(
            new ElementoVital(
                createVector(eje_OrigenX, eje_OrigenY),
                angulo_Memoria,
                grosor_Resistencia,
                "Memoria"
            )
        );
    }

    colorMode(RGB);
}

function draw() {
    // 1. Repintar el fondo
    background(4);

    let nuevos_Elementos = [];
    let elementos_Activos = 0;

    // 2. DESARROLLO MORFOLÓGICO (Expandir y Bifurcar)
    for (let i = morfologias.length - 1; i >= 0; i--) {
        let elemento = morfologias[i];

        if (!elemento.terminado) {
            elemento.expandir();
            elementos_Activos++;

            if (
                ciclo_Activo &&
                elemento.trayectoria > elemento.umbral_Division &&
                random() < 0.15
            ) {
                let divisiones = elemento.dividir();
                nuevos_Elementos = nuevos_Elementos.concat(divisiones);
            }
        }
    }
    morfologias = morfologias.concat(nuevos_Elementos);

    // 3. TRAZADO DEL ÁRBOL
    for (let elemento of morfologias) {
        elemento.trazar();
    }

    // 4. PARTÍCULAS DE HOJAS
    for (let i = hojas.length - 1; i >= 0; i--) {
        let hoja = hojas[i];
        hoja.actualizar();
        hoja.trazar();
        if (hoja.estaMuerta()) hojas.splice(i, 1);
    }

    // 5. CESE DEL CRECIMIENTO y ACTIVACIÓN DE HOJAS
    let porcentajeTerminado = (morfologias.length - elementos_Activos) / morfologias.length;
    let umbral_Madurez = 0.75;

    if (morfologias.length > 50 && porcentajeTerminado > umbral_Madurez) {
        if (!hojas_Activadas) {
            activarCaidaDeHojas(); 
            hojas_Activadas = true;
        }

        if (porcentajeTerminado > 0.9) {
            ciclo_Activo = false;
        }
    }
}

function mouseClicked() {     
        hojas = [];
        activarCaidaDeHojas();
}
function keyPressed() {
    if (key === ' ') { // La barra espaciadora genera un espacio ' '
        reiniciarSistema();
    }
}
