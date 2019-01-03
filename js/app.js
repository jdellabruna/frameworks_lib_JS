COMBO            = 30
CANT_FILAS       = 7;
CANT_COLUMNAS    = 7;
var grilla       = [];
var off          = 34;
var estado       = true;
var cant_figuras = 0;
var cant_movimientos = 0;
var huboCambios  = false;

// Alterna 2 colores en el título.
setInterval(function (){
  if ( estado ) {
    $( ".main-titulo" ).animate({
      color: "#DCFF0E;",
    }, 200 );
  } else {
    $( ".main-titulo" ).animate({
      color: "#58FAF4",
    }, 200 );
  }
  estado = !estado;
}, 3000);

//------------------------------------------------------------------------
//Al clickear en iniciar, cambiar el texto del botón a Reiniciar
$(".btn-reinicio").click(function() {
  if ($(this).text() != "Reiniciar") {
    $(this).text("Reiniciar")
    //2 minutos despues de click en iniciar, expira el tiempo
    cant_movimientos = 0;
    setTimeout(fin_tiempo, 2 * 60 * 1000)
    ActualizaTiempo(2); //actualizar el contador de tiempo.
    //Busca las ternas formadas al actualizar
    destruirTernas();
  } else {
    //Recargar la pagina, reinicia el juego
    location.reload();
  }
});

function fin_tiempo(){
  // Producir efecto para mostrar finalizacion.
  $(".panel-tablero").hide()
  $(".time").hide()
  $("<h2 class='data-titulo'>Juego Terminado!</h2>").insertBefore(".panel-score");
  $(".panel-score").animate({ width: '100%' }, 1000);
}

function agregar_puntuacion(cantidad) {
  var score= parseInt($("#score-text").text())
  $("#score-text").text(score + cantidad)
}
//------------------------------------------------------------------------------
//Actualizar contador de tiempo
function ActualizaTiempo(minutos) {
  var segundos = 60;
  var mins = minutos
  function paso() {
    var contador = document.getElementById("timer");
    var actual_minutos = mins - 1
    segundos--;
    contador.innerHTML = actual_minutos.toString() + ":" + (segundos < 10 ? "0" : "") + String(segundos);
    if( segundos > 0 ) {
      setTimeout(paso, 1000);
    } else {
      if(mins > 1){
        ActualizaTiempo(mins-1);
      }
    }
  }
  paso();
}
//------------------------------------------------------------------------------
function golosina(fila, columna, obj, src)
{
  return {
    fila: fila,  // fila actual
    columna: columna,  // columna actual
    src: src, // imagen mostrada en la celda (r,c)
    redibujar: false,
    enTerna: false, // Indica si la celda está en una figura valida
    o: obj
  }
}
//------------------------------------------------------------------------------
// Distintas imagenes segun el tipo de golosina
var tiposGolosina = [];
tiposGolosina[0] = "image/1.png";
tiposGolosina[1] = "image/2.png";
tiposGolosina[2] = "image/3.png";
tiposGolosina[3] = "image/4.png";

// Devuelve aleatoriamente un tipo de golosina.
function randomTipoGolosina()
{
  var nroImg = Math.floor((Math.random() * 4));
  return tiposGolosina[nroImg];
}

// Rellenar la grilla con golosinas al azar
for (var fila = 1; fila <= CANT_FILAS; fila++)
{
  grilla[fila] = [];
  for (var columna = 1; columna <= CANT_COLUMNAS; columna++) {
    grilla[fila][columna] = new golosina(fila, columna, null, randomTipoGolosina());
  }
}

// Coordenadas y tamaños para empezar a dibujar
var ancho = $('.panel-tablero').width();
var alto = $('.panel-tablero').height();
var anchoCelda = ancho / CANT_COLUMNAS;
var altoCelda = alto / CANT_FILAS;

for (var fila = 1; fila <= CANT_FILAS; fila++) {
  for (var columna = 1; columna <= CANT_COLUMNAS; columna++) {
    var topPx  = fila * altoCelda + off
    var leftPx = columna * anchoCelda
    var cell = $("<img class='golosina' id='golosina_"+fila+"_"+columna+"' r='"+fila+"' c='"+columna+"' ondrop='alArrastrar(event)' ondragover='alSoltar(event)' src='"+grilla[fila][columna].src+"' style='padding-right:15px;width:"+(anchoCelda-20)+"px;height:"+altoCelda+"px;position:absolute;top:"+topPx+"px;left:"+leftPx+"px'/>");
    cell.attr("ondragstart","alIniciarArrastrar(event)")
    $(".col-"+columna).append(cell)
    grilla[fila][columna].o = cell
  }
}

function alIniciarArrastrar(a)
{
  a.dataTransfer.setData("text/plain", a.target.id);
}

function alSoltar(e)
{
  e.preventDefault();
}

// Cuando se deja una golosina sobre otra, hacer cambios, etc.
function alArrastrar(e)
{
  if ($(".btn-reinicio").text() != "Iniciar") {
     //obtener origen del movimiento
     var src = e.dataTransfer.getData("text");
     var sr = src.split("_")[1];  //origen fila
     var sc = src.split("_")[2];  //origen columna

     //obtener destino del movimiento
     var dst = e.target.id;
     var dr = dst.split("_")[1];  //destino fila
     var dc = dst.split("_")[2];  //destino columna

     // ver si la distancia entre origen y destino es mayor que 1: movimiento inválido
     var ddx = Math.abs(parseInt(sr)-parseInt(dr));
     var ddy = Math.abs(parseInt(sc)-parseInt(dc));
     if (ddx > 1 || ddy > 1)
     {
       alert("Movimiento invalido! (distancia mayor a 1)");
       return;
     }

     // Si Ok el movimiento, incrementar contador de movimientos y actualizarlo
     cant_movimientos += 1;
     $("#movimientos-text").text(cant_movimientos)

     // Intercambiar las golosinas para eso utilizo temporal para no sobreescribir posiciones
     var tmp = grilla[sr][sc].src;
     grilla[sr][sc].src = grilla[dr][dc].src;
     grilla[sr][sc].o.attr("src",grilla[sr][sc].src);
     grilla[dr][dc].src = tmp;
     grilla[dr][dc].o.attr("src",grilla[dr][dc].src);

     // Buscar combinaciones ganadoras de golosinas
     destruirTernas();
  } else { // Si el juego no arrancó, indicar error
     $("body").append('<div id="dialog" title="Error"><p>El juego no ha comenzado, \n\nHaz click en Iniciar!</p></div>')
     $( "#dialog" ).dialog();
    }
}

//------------------------------------------------------------------------------
function destruirTernas()
{
  var celdaAnterior     = null;
  var fila         = 1

  // Recorrida horizontal buscando combinaciones ganadoras
  arrHorizontal= []
  for (var fila=1; fila <= CANT_FILAS; fila++)
  {
    for (var j=1; j <= 7; j++)
    {
      var celda = {src:grilla[fila][j].src, Xfila:fila, Xcol:j};
      arrHorizontal.push(celda)
    }
  }

  // Generar la actualizacion en la grilla
  var celdaAnterior  = null
  var j = 0
  while (j < arrHorizontal.length-2) {
    if (celdaAnterior == null) {
      celdaAnterior = arrHorizontal[j].src
    } else {
      if ((celdaAnterior == arrHorizontal[j+1].src) && (celdaAnterior == arrHorizontal[j+2].src)
      && (arrHorizontal[j].Xcol != 7)
    ){
      grilla[arrHorizontal[j].Xfila][arrHorizontal[j].Xcol].enTerna     = true
      grilla[arrHorizontal[j+1].Xfila][arrHorizontal[j+1].Xcol].enTerna = true
      grilla[arrHorizontal[j+2].Xfila][arrHorizontal[j+2].Xcol].enTerna = true
      j = j + 3;
      cant_figuras += 1
      huboCambios = true;
      celdaAnterior = null
    } else {
      j++;
      celdaAnterior = arrHorizontal[j].src
    }
  }
}

// Recorrida vertical buscando combinaciones ganadoras
arrVertical = []
for (var j=1; j <= 7; j++)
{
  for (var columna=1; columna <= CANT_COLUMNAS; columna++)
  {
    var celda = {src:grilla[columna][j].src, Xfila:columna, Xcol:j};
    arrVertical.push(celda)
  }
}

// Generar actualizacion en la grilla
var celdaAnterior  = null
var j = 0
while (j < arrVertical.length-2) {
  if (celdaAnterior == null) {
    celdaAnterior = arrVertical[j].src
  } else {
    if ((celdaAnterior == arrVertical[j+1].src) && (celdaAnterior == arrVertical[j+2].src)
    && (arrVertical[j].Xfila != 7)) {
      grilla[arrVertical[j].Xfila][arrVertical[j].Xcol].enTerna     = true
      grilla[arrVertical[j+1].Xfila][arrVertical[j+1].Xcol].enTerna = true
      grilla[arrVertical[j+2].Xfila][arrVertical[j+2].Xcol].enTerna = true
      j = j + 3;
      huboCambios = true;
      celdaAnterior = null
      cant_figuras += 1
    } else {
      j++;
      celdaAnterior = arrVertical[j].src
    }
  }
}

if (huboCambios == true) {
  agregar_puntuacion(cant_figuras * COMBO) //puntuacion por las ternas formadas
  cant_figuras = 0
  huboCambios = false
  destruirCeldas(); //chequear si se produjeron nuevas ternas validas
}
}

//------------------------------------------------------------------------------
// Destruir golosinas que estaban en combinaciones ganadoras y generar nuevas golosinas en su lugar
function destruirCeldas()
{
  for (var fila=1; fila <= CANT_FILAS; fila++)
     for (var columna=1; columna <= CANT_COLUMNAS; columna++)
       if (grilla[fila][columna].enTerna)
       {
         grilla[fila][columna].o.animate({
           opacity:0
         },500);
       }

  $(":animated").promise().done(function() {
    destruirEnArray();
  });
}

function destruirEnArray() {
  for (var fila=1; fila <= CANT_FILAS; fila++)
  {
    for (var columna=1; columna <= CANT_COLUMNAS; columna++)
    {
      if (grilla[fila][columna].enTerna)
      {
        grilla[fila][columna].src = ""
        grilla[fila][columna].enTerna = false;
      }
    }
  }

  //Buscar y resetear las celdas correspondientes
  for (var fila = 1; fila <= CANT_FILAS; fila++)
  {
    for (var columna = 1; columna <= CANT_COLUMNAS; columna++)
    {
      grilla[fila][columna].o.attr("src",grilla[fila][columna].src);
      grilla[fila][columna].o.css("opacity","1");
      grilla[fila][columna].enTerna = false;
      if ((grilla[fila][columna].src == null) || (grilla[fila][columna].src == "")) {
        grilla[fila][columna].redibujar = true;
      }
      if (grilla[fila][columna].redibujar == true)
      {
        grilla[fila][columna].redibujar = false;
        grilla[fila][columna].src = randomTipoGolosina()
        grilla[fila][columna].o.attr("src",grilla[fila][columna].src);
        grilla[fila][columna].o.attr("ondragstart","alIniciarArrastrar(event)");
        grilla[fila][columna].o.attr("ondrop","alArrastrar(event)");
        grilla[fila][columna].o.attr("ondragover","alSoltar(event)");
      }
    }
  }

  // Busca nuevas configuraciones ganadoras, porque hay nuevas fichas en juego
  destruirTernas();
}
