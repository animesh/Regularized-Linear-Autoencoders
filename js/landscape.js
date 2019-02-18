if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera;

init();
animate();


function init() {

	var container = document.getElementById( 'container' );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( "white" );

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 0, -20, 35 );
	camera.up.set( 0, 0, 1 );

	var group = new THREE.Group();
	scene.add( group );

	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
	directionalLight.position.set( 0.75, 0.75, 1.0 ).normalize();
	scene.add( directionalLight );

	var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );
	scene.add( ambientLight );

	var helper = new THREE.GridHelper( 20, 10 );
	helper.rotation.x = Math.PI / 2;
	helper.position.set( 0, 0, 0 );
	group.add( helper );

	var w1 = makeTextSprite( "w1", { fontsize: 20 } );
	var w2 = makeTextSprite( "w2", { fontsize: 20 } );
	w1.position.set(-12,0,0);
	w2.position.set(0,-12,0);
	group.add( w1 );
	group.add( w2 );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );
	var dist = (camera.position.x**2 + camera.position.y**2 + camera.position.z**2)**0.25;
	camera.lookAt(0,0,dist) 

	render();

}

function render() {

	renderer.render( scene, camera );

}


var geometry, object, material;

function removeLandscape() {

	scene.remove(object);
	if (object != undefined) {
		object.geometry.dispose();
		object.material.dispose();
		object = undefined;
	} 

}

function addLandscape(loss, x, lamb, pow) {

	material = new THREE.MeshPhongMaterial( {
					color: 0x156289,
					emissive: 0x072534,
					side: THREE.DoubleSide,
					flatShading: true,
					transparent: true,
					opacity: 0.8
				} );
	geometry = new THREE.ParametricBufferGeometry( THREE.ParametricGeometries[loss](x, lamb, pow, 4,4), 75, 75 );
	object = new THREE.Mesh( geometry, material );
	object.position.set( 0, 0, 0 );
	object.scale.multiplyScalar( 5 );

	scene.add( object );
}


THREE.ParametricGeometries = {

	Unregularized: function ( x, lamb, pow, width, height ) {
		return function ( u, v, target ) {

			u -= 0.5;
			v -= 0.5;

			var w1 = u * width;
			var w2 = v * height;
			if (x.length == 1) {
				var z = (x[0] - w2 * w1 * x[0])**2;
			} else {
				var z = (x[0] - w1**2 * x[0])**2 + (x[1] - w2**2 * x[1])**2;
			}

			target.set( w1, w2, z );
		};
	},

	Product: function ( x, lamb, pow, width, height ) {
		return function ( u, v, target ) {

			u -= 0.5;
			v -= 0.5;

			var w1 = u * width;
			var w2 = v * height;
			if (x.length == 1) {
				var z = (x[0] - w2 * w1 * x[0])**2 + lamb * Math.abs(w2 * w1)**pow;
			} else {
				var z = (x[0] - w1**2 * x[0])**2 + (x[1] - w2**2 * x[1])**2 + lamb * (w1**4 + 2 *(w1 * w2)**2 + w2**4);
			}

			target.set( w1, w2, z );
		};
	},

	Sum: function ( x, lamb, pow, width, height ) {
		return function ( u, v, target ) {

			u -= 0.5;
			v -= 0.5;

			var w1 = u * width;
			var w2 = v * height;

			if (x.length == 1) {
				var z = (x[0] - w2 * w1 * x[0])**2 + lamb * (Math.abs(w1)**pow + Math.abs(w2)**pow);
			} else {
				var z = (x[0] - w1**2 * x[0])**2 + (x[1] - w2**2 * x[1])**2 + 2 * lamb * (w1**2 + w2**2);
			}

			target.set( w1, w2, z );
		};
	}

};



var scalar = function() {
  this.loss = 'Unregularized',
  this.x = 1,
  this.lamb = 0.5,
  this.pow = 2
};

var vector = function() {
  this.loss = 'Unregularized',
  this.x1 = 1,
  this.x2 = 1,
  this.lamb = 0.5,
  this.pow = 2
};	


window.onload = function() {
	var gui = new dat.GUI();
	var f1 = gui.addFolder('Scalar Case (m=1, k=1)');
	var f2 = gui.addFolder('Vector Case (m=2, k=1)');
	
	var obj1 = new scalar();
	var graph1 = function() {
		removeLandscape();
		addLandscape(obj1.loss, [obj1.x], obj1.lamb, obj1.pow);
		f2.close();
	}
	f1.add(obj1, 'loss', ['Unregularized', 'Product', 'Sum']).onChange(graph1).name('Loss Function');
	f1.add(obj1, 'x', 0, 2).onChange(graph1).name(katex.renderToString('x'));
	f1.add(obj1, 'lamb', 0, 2).onChange(graph1).name(katex.renderToString('\\lambda'));
	f1.add(obj1, 'pow', 0.5, 4).onChange(graph1).name(katex.renderToString('\\alpha'));

	var obj2 = new vector();
	var graph2 = function() {
		removeLandscape();
		addLandscape(obj2.loss, [obj2.x1, obj2.x2], obj2.lamb, obj1.pow);
		f1.close();
	}
	f2.add(obj2, 'loss', ['Unregularized', 'Product', 'Sum']).onChange(graph2).name('Loss Function');
	f2.add(obj2, 'x1', 0, 2).onChange(graph2).name(katex.renderToString('x_1'));
	f2.add(obj2, 'x2', 0, 2).onChange(graph2).name(katex.renderToString('x_2'));
	f2.add(obj2, 'lamb', 0, 2).onChange(graph2).name(katex.renderToString('\\lambda'));

	graph1();
	f1.open();
};
