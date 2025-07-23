var canvas, view;
var sc, seed, params;
var t, go, capture;

var grid, cols, rows, margin;
var dots, dotCount;

var back = [32,32,32];
var front = [[255,255,255]];
const gap = 60;
const skw = 1080, skh = 1080;
const stepsPerFrame = 3;

var vid, startVid, stopVid, recording;
const vid_len = 1200;

function setup() {
    view = createCanvas(int(windowHeight * skw/skh), windowHeight);
    view.parent('container');

    params = getURLParams();

    sc = 1;
    // cell = gap*2;
    margin = 200;
    cols = int((skw+margin*2)/gap)+1;
    rows = int((skh+margin*2)/gap)+1;

    startVid = stopVid = recording = false;

    col_generate();
    generate();
    reset();
}

function generate() {
    seed = 'seed' in params ? parseInt(params.seed) : int(Math.random() * 99999999);
    console.log("SEED", seed);
}

function col_generate() {
    colseed = 'colseed' in params ? parseInt(params.colseed) : int(Math.random() * 99999999);
    console.log("COLSEED", colseed);
}

function reset() {
    console.log("?seed="+seed+"&colseed="+colseed);

    randomSeed(colseed);
    noiseSeed(colseed);

    csp = new ColorSpace({num:7});
    csp.makeBackAndLine(0.7);
    csp.run(300);

    back = csp.getVal(0);
    console.log(back)
    front = csp.getList(1);

    randomSeed(seed);
    noiseSeed(seed);

    canvas = createGraphics(skw*sc, skh*sc);
    canvas.background(back[0], back[1], back[2]);
    canvas.noStroke();
    // canvas.rectMode(RADIUS);

    dots = new Set();
    dotCount = 0;
    t = 0;
    go = true;
    capture = false;

    config = configs[configs.length-1];
    let init = config.init();
    if(! Array.isArray(init)) init = [init];

    for(let cf of init){
        cf.prev = null;
        for(let i=0; i<cf.num; i++){
            let neo = new Dot(cf);
            cf.prev = neo;
        }
    }

    if(startVid) {
        vid = new CCapture({
            format: 'webm',
            framerate:60,
            name: getTimestamp()+'_'+config.name+'_s'+String(seed)+'_cs'+String(colseed),
            verbose: false,
            display: true,
            quality: 82,
        });
    }

}

function draw() {
    if(startVid) {
         vid.start();
         recording = true;
         startVid = false;
         console.log("VID started");
    }

    if(go || step){
        // canvas.background(back[0], back[1], back[2]);

        for(let i=0; i<stepsPerFrame; i++){
            makeStep();
        }
        
        // if(trace != '') {
        //     canvas.fill(255)
        //     canvas.textSize(12*sc);
        //     canvas.text(trace, 25*sc, (canvas.height-90*sc));
        // }
        
        image(canvas, 0, 0, width, height);

        if(recording) {
             vid.capture(document.getElementById('defaultCanvas0'));

            if(stopVid || t >= vid_len) {
                vid.stop();
                vid.save();
                vid = null;
                recording = false;
                stopVid = false;
                console.log("VID finished");
            }
        }

        t++;
        if(t%180 == 1) console.log(t, frameRate());
        step = false;
    }
}

function makeStep(){
    grid = [];
    flashes = [];

    canvas.background(back[0], back[1], back[2]);

    for(let d of dots) d.update();

    let a, b, d, rr, dif = createVector();
    for(let c=0; c<cols; c++){
        if(grid[c] === undefined) continue;
        for(let r=0; r<rows; r++){
            if(grid[c][r] === undefined) continue;
            let ns = [...grid[c][r]]; // this one
            if(c < cols && grid[c+1] !== undefined && grid[c+1][r] !== undefined) ns.push(...grid[c+1][r]); // right
            if(r < rows && grid[c][r+1] !== undefined) ns.push(...grid[c][r+1]); //bottom
            if(c < cols && r < rows && grid[c+1] !== undefined && grid[c+1][r+1] !== undefined) ns.push(...grid[c+1][r+1]); // bottom right
            if(c > 0 && r < rows && grid[c-1] !== undefined && grid[c-1][r+1] !== undefined) ns.push(...grid[c-1][r+1]); // bottom left

            for(let i=0; i<grid[c][r].length; i++){
                a = grid[c][r][i];
                a.close = [];
                for(let j=i+1; j<ns.length; j++){
                    b = ns[j];
                    // if(a == b) continue;
                    dif.set(a.pos.x-b.pos.x, a.pos.y-b.pos.y);
                    d = dif.mag();
                    // console.log(t, a.ix, b.ix, d)
                    a.close.push([b, dif.copy(), d]);
                    rr = a.rad + b.rad;
                    if(d < rr) {
                        dif.setMag(lerp(5, 0, d/(rr)));
                        a.vel.add(dif);
                        b.vel.sub(dif);           
                    }
                }
                // console.log(a.ix, a.close)
            }

        }
    }

    // t++;
}

/******* BASE CLASS FOR TWEENABLE OBJECTS *********/

class Tweenable {
    constructor() {
        this.tweens =  new Set();

        this.nrm = 0;
        this.mT = 0;
    }

    read(obj, prop, s, df){
        //console.log('read', prop, s, df);

        if (s === undefined || s === null) s = df;
        if (!isNaN(Number(s))) { obj[prop] = Number(s); return; }
        if(prop == "col"){
            if (Array.isArray(s)) { this.col = s; return; }
            if (typeof s === 'string') { this.col = chroma(s).rgb() }
        }

        s = {src:"t", cv:"pow", cy:1, fr:0, to:100, pw:1, mn:0, mx:1, ph:0, cn:1, v:0.5, vv:0, vi:0, vt:0, lc:0.5, sp:1, nd:0, ...s};
        for(let p in s) if(typeof s[p] == "object" && !('pos' in s[p]) && !Array.isArray(s[p])) this.read(s, p, s[p], 0);
        s.obj = obj;
        s.prop = prop;

        if( ['t', 'gt', 'nrm', 'dst', 'trnd', 'var'].includes(s.src) ) { this.tweens.add(s); return; }
        if(s.src == "rnd") { 
            if(prop == "col") obj["col"] = gradient(s.cs,  this.calcCrv(s, random(1)))
            else obj[prop] = this.calcCrv(s, random(1));
            return;
        }
        if(s.src.startsWith('d-')) {
            let p = s.src.substring(2);
            if(prop == "col") obj["col"] = gradient(s.cs,  this.calcCrv(s, this.group[p]))
            else obj[prop] = this.calcCrv(s, this.group[p]);
            return;
        }
        if(prop == "col") obj["col"] = gradient(s.cs,  this.calcCrv(s, this[s.src]))
        else obj[prop] = this.calcCrv(s, this[s.src]);
    }

    addVar(name, val){
        this[name] = 0;
        this.read(this, name, val, 0);
    }

    update() {
        for (let tw of this.tweens) this.tween(tw);
        this.mT ++;
    }

    tween(tw) {
        let v = 0;
        
        switch(tw.src) {
            // case 't': v = fract(this.mT/tw.to); break;
            case 't':
                v = this.life > 0 ? this.mT / (this.life+1) : 0;
                break;
            case 'dt':
                v = this.dad.life > 0 ? this.dad.mT / (this.dad.life+1) : 0;
                break;
            // case 'var': v = tweens[tw.name]; break;
        }

        if(tw.prop == 'col') tw.obj['col'] = gradient(tw.cs, this.calcCrv(tw, v))
        else tw.obj[tw.prop] = this.calcCrv(tw, v);

        if(tw.nd > 0 && this.mT >= tw.nd) this.tweens.delete(tw);
    }

    calcCrv(c, v) {
        let o = 0;

        if(c.cv == 'fix') { // v
            o = c.v;
        } else if(c.cv == 'mod') { // cy
            o = fract(this.ix/c.cy);
        } else if(c.cv == 'pow') { // pw
            v = fract(v*c.cy);
            o = c.pw < 0 ? 1-pow(1-v, abs(c.pw)) : pow(v, c.pw);
        } else if(c.cv == 'wiggle') { // vv
            o = constrain(v + random(-c.vv, c.vv), 0, 0.999999);
        } else if(c.cv == 'circ') { //
            o = cos(asin(v*2-1));
        } else if(c.cv == 'sin') { // ph, cy, pw
            // o = pow(sin(v*TWO_PI*c.cy + (c.ph-0.25)*TWO_PI)*0.5+0.5, c.pw);
            o = pow(sin((c.ph+v)*TWO_PI*c.cy)*0.5+0.5, c.pw);
        } else if(c.cv == 'cos') { // ph, cy, pw
            o = pow(cos((0.5+c.ph+v)*TWO_PI*c.cy)*0.5+0.5, c.pw);
        } else if(c.cv == 'half-sin') { // ph, cy, pw
            v = fract(v*c.cy);
            o = pow(sin(fract(c.ph+v)*PI), c.pw);
        } else if(c.cv == 'peak') { // lc, pw
            if(v < c.lc) o = pow( v/c.lc, c.pw );
            else o = pow( map(v, c.lc, 1, 1, 0), c.pw);
        } else if(c.cv == 'bump') { // lc, sp
            if(v > c.lc - c.sp/2 && v < c.lc + c.sp/2) {
                o = sin( map(v, c.lc-c.sp/2, c.lc+c.sp/2, 0, PI) );
            }
        } else if(c.cv == 'noise') { // vv, vi, vt, cn
            o = contrast( noise(c.vv, this.nrm*c.vi, v*c.vt ), c.cn );
            //console.log(v, o);
        } else if(c.cv == 'noise-pow') { // vv, vi, vt, pw
            o = pow( noise(c.vv, this.nrm*c.vi, v*c.vt ), c.pw );
        } else if(c.cv == "noise-field") { // vv, sc, cn
            o = contrast( noise(c.vv, this.pos.x*c.sc, this.pos.y*c.sc), c.cn );
        } else if(c.cv == "noise-loop") { // vv, sc, cn
            o = contrast( noise(c.vv, 8+c.r*cos(v*PI*2), 8+c.r*sin(v*PI*2)), c.cn );
        } else if(c.cv == 'steps') { // vs, pw
            v = constrain(v, 0, 0.9999);
            let n = floor(v*(c.vs.length-1))
            v = fract(v*(c.vs.length-1));
            let x;
            if(v < 0.5) x = pow(v*2, c.pw) * 0.5;
            else x = (1 - pow(1-(v-0.5)*2, c.pw)) * 0.5 + 0.5;
            o = lerp(c.vs[n], c.vs[n+1], x);
        } else if(c.cv == 'pick') { // vs - Caso especial: retorna el valor sin mapearlo
            v = constrain(v, 0, 0.9999);
            return c.vs[ floor(v*c.vs.length) ];
        } else if(c.cv == 'odd') { // vs - Caso especial: par-impar
            return c.vs[ this.ix % 2 ];
        } else if(c.cv == 'ix') { // vi - Caso especial: multiplicación por ix
            return this.ix * c.vi;
        } else if(c.cv == 'div') { // cy - Caso especial: división sin mapeo
            return int(v/c.cy);
        }

        return c.mn + o * (c.mx-c.mn);
    }
}


/***************** DOT ******************/

class Dot extends Tweenable{
    constructor(c) {
        super(c);

        dots.add(this);
        this.ix = dotCount;
        dotCount ++;
        this.gen = random(1);
        this.dad = c.dad || null;
        this.prev = c.prev || null;
        this.close = [];

        this.read(this, 'mass', c.mass, 1);
        this.read(this, 'rad', c.rad, gap);
        this.read(this, 'size', c.size, 2); // como proporción de this.rad
        this.read(this, 'rot', c.rot, random(-PI, PI));
        this.read(this, 'damp', c.damp, 0.85);
        this.read(this, 'limit', c.limit, 8);
        this.read(this, 'col', c.col, front[0]);
        this.read(this, 'alpha', c.alpha, 255);
        this.read(this, 'life', c.life, 0);

        // let pr = this.dad == null ? {x:0, y:0} : this.dad.pos;
        // let o = {}
        if('pos' in c){
            let rf = this.dad;
            if('ref' in c.pos && c.pos.ref == 'prev') rf = this.prev;
            let prf = rf == null ? {x:0, y:0} : rf.pos;
            let o = {}
            if('r' in c.pos) {
                this.read(o, 'r', c.pos.r, 0);
                this.read(o, 'a', c.pos.a, 0);
                this.pos = createVector(prf.x + o.r * cos(o.a), prf.y + o.r * sin(o.a));
            } else {
                this.read(o, 'x', c.pos.x, 0);
                this.read(o, 'y', c.pos.y, 0);
                this.pos = createVector(prf.x + o.x, prf.y + o.y);
            } 
        } else {
            this.pos = createVector(random(skw), random(skh))
        }
        
        this.vel = createVector();
        this.wrap = c.wrap || false;

        this.forces = [];
        if('forces' in c) {
            for(let f of c.forces) this.addForce(f);
        }
        // this.ref = c.ref || {pos:{x:skw/2, y:skh/2}};
        // this.rot = 0;
        this.children = [];
        if('children' in c){
            for(let ch of c.children) this.addChild(ch);
        }

        this.mT = -1;
        // console.log(this.ix, this.prev);
    }

    addForce(f) {
        let ff = {ty:'spring', f:0.01, n:1, r:0, a:0, br:0, ba:0, len:100, bi:false, rl:false, ...f}

        for(let p in ff) {
            if(typeof ff[p] == "object" && ! ('pos' in ff[p]) ) this.read(ff, p, ff[p], 0);
            
        }

        if('ref' in ff) {
            if(ff.ref == "dad") ff.ref = this.dad;
            else if(ff.ref == "prev") ff.ref = this.prev; 

            if(ff.ref == null) return;
            // console.log(this.ix, ff)
        }

        this.forces.push(ff);
    }

    addChild(_ch) {
        let ch = {num:1, every:1, since:0, until:999999, dad:this, prev:this, ..._ch};
        // console.log(ch)

        this.children.push(ch);
    }

    update() {
        super.update();

        for (let f of this.forces) this.applyForce(f);

        this.vel.limit(this.limit);
        this.pos.add(this.vel);
        this.vel.mult(this.damp);

        if(this.wrap){
            if(this.pos.x < -margin/2) this.pos.x += skw + margin;
            if(this.pos.y < -margin/2) this.pos.y += skh + margin;
            if(this.pos.x > skw+margin/2) this.pos.x -= skw + margin;
            if(this.pos.y > skh+margin/2) this.pos.y -= skh + margin;
        }

        canvas.fill(this.col[0], this.col[1], this.col[2], this.alpha);
        canvas.circle(this.pos.x*sc, this.pos.y*sc, this.rad*this.size*sc);
        // canvas.push();
        // canvas.translate(this.pos.x*sc, this.pos.y*sc);
        // canvas.rotate(this.rot);
        // // canvas.ellipse(0, 0, this.r*2*this.size*sc, this.r*2*this.size*this.ratio*sc);
        // canvas.triangle(
        //     this.rad, 0,
        //     -this.rad, -this.rad*0.5,
        //     -this.rad, this.rad*0.5
        // )
        // canvas.pop();

        for(let ch of this.children){
            if(this.mT > ch.since && this.mT < ch.until && this.mT % ch.every == 0){
                // ch.prev = this;
                // ch.dad = this;
                for(let n=0; n<ch.num; n++){
                    let neo = new Dot(ch)
                    ch.prev = neo;
                }
            }
        }

        if(this.life > 0 && this.mT >= this.life){
            dots.delete(this);
        }

        // if(this.ix == 1) console.log(this.pos.x, this.pos.y);
        // if(this.ix == 11 || this.ix == 12) console.log(this.ix, this.rot);
    }

    applyForce(f) {
        let md;

        if(f.ty == "wind"){ //f, a
            this.vel.add( f.f*this.mass * cos(f.a), f.f*this.mass * sin(f.a) );

        } else if(f.ty == 'noisewind'){ // f, vv, iv, tv
            this.vel.add(
                lerp(-f.f, f.f, noise(0+f.vv, this.ix*f.iv, t*f.tv)),
                lerp(-f.f, f.f, noise(8+f.vv, this.ix*f.iv, t*f.tv))
            );

        } else if(f.ty == 'noisepull'){ // f, cn, vv, iv, tv
            let o = [
                contrast(noise(0+f.vv, this.ix*f.iv, t*f.tv), f.cn) * skw,
                contrast(noise(8+f.vv, this.ix*f.iv, t*f.tv), f.cn) * skh,
            ]
            md = [
                (o[0] - this.pos.x) * f.f * this.mass,
                (o[1] - this.pos.y) * f.f * this.mass
            ]
            // console.log(o);
            this.vel.add(md[0], md[1]);
            
        } else if(f.ty == "pull"){ // f
            md = [
                (f.ref.pos.x - this.pos.x) * f.f * this.mass,
                (f.ref.pos.y - this.pos.y) * f.f * this.mass
            ]
            this.vel.add(md[0], md[1]);
            if(f.bi) f.ref.vel.sub(md[0], md[1])

        } else if(f.ty == "spring"){ // f, ln, bi
            let dif = createVector(f.ref.pos.x-this.pos.x, f.ref.pos.y-this.pos.y);
            dif.setMag( (dif.mag()-f.len)*f.f*this.mass );
            this.vel.add(dif);
            if(f.bi) f.ref.vel.sub(dif);

        }if(f.ty == "brownian"){ //f, every
            if(this.mT % f.every == 0){
                let a = random(-PI, PI)
                this.vel.add( f.f*this.mass * cos(a), f.f*this.mass * sin(a) );
            }
            

        } else if(f.ty == "align"){ // f
            for(let nb of this.close){
                if(nb[2] <= gap){
                    let ad = angDif(nb[0].rot, this.rot) * pow(1-(nb[2]/gap), 2) * f.f;
                    this.rot -= ad;
                    //nb[0].rot -= ad;
                } 
            }

        } else if(f.ty == "swarm"){ // f
            for(let nb of this.close){
                if(nb[2] <= gap){
                    md = [
                        nb[1].x * f.f * pow(1-(nb[2]/(gap)), 2),
                        nb[1].y * f.f * pow(1-(nb[2]/(gap)), 2),
                    ]
                    this.vel.sub(md[0], md[1]);
                    nb[0].vel.add(md[0], md[1]);
                } 
            }

        } else if(f.ty == "forward"){ // f
            this.vel.add(f.f * cos(this.rot), f.f * sin(this.rot));

        } else if(f.ty == "grid") {
            let cx = int((this.pos.x+margin)/gap), cy = int((this.pos.y+margin)/gap);
            if(cx >= 0 && cx <= cols && cy >= 0 && cy <= rows) {
                if(grid[cx] === undefined){
                    grid[cx] = [];
                    grid[cx][cy] = [this];
                } else {
                    if(grid[cx][cy] === undefined){
                        grid[cx][cy] = [this];
                    } else {
                        grid[cx][cy].push(this);
                    }
                }
            }
        }
    }

}

// function angDif(a, b) {
//     let s  = (b-a) > 0 ? 1 : -1;
//     let d = abs(b - a);
//     return d > PI ? abs(PI*2 - d) * -s : d * s;
// }

function angDif(angle1, angle2) {
  // Calculate the raw difference between the two angles.
  let difference = angle2 - angle1;

  // Normalize the difference to be within the range of -2*PI to 2*PI.
  // The % operator in JavaScript retains the sign of the dividend.
  difference = difference % (2 * Math.PI);

  // Adjust the difference to be within the desired range (-Math.PI, Math.PI].
  // If the difference is greater than PI, subtract 2*PI to get the equivalent
  // angle in the negative range.
  if (difference > Math.PI) {
    difference -= (2 * Math.PI);
  }
  // If the difference is less than or equal to -PI, add 2*PI to get the equivalent
  // angle in the positive range.
  else if (difference <= -Math.PI) {
    difference += (2 * Math.PI);
  }

  // Desequilibrio para impedir que se abrochen ángulos opuestos (no anda)
//   if( abs(PI - abs(difference)) < 0.2){
//     // console.log(t, difference)
//     difference -= 1;
//   } 

  return difference;
}

function gradient(cs, v) {
    let scale = chroma.scale(cs).mode('lab');
    return scale(v).rgb();
}

function contrast(n, pw) {
    if(n < 0.5) return pow(n*2, pw) * 0.5;
    return 1 - Math.pow((1-(n-0.5)*2), pw) * 0.5
}

function getTimestamp(){
    var dateObj = new Date();
    var year = dateObj.getUTCFullYear();
    var month = dateObj.getUTCMonth() + 1; // months from 1-12
    var day = dateObj.getUTCDate();

    return year.toString().substring(2) + month.toString().padStart(2,"0") + day.toString().padStart(2,"0")

}

function keyTyped() {
    if (key === ' ') {
        go = !go;
        console.log("go:", go);
    } else if (key === 'r') {
        reset()
    } else if (key === 'g') {
        generate();
        reset();
    } else if (key === '.') {
        step = true;
    } else if (key === 'n') {
        // sx ++; sx %= scripts.length;
        // reset();
    } else if (key === 'N') {
        // sx --; if(sx < 0) sx += scripts.length;
        // reset();
    }  else if (key === 's') {
        // saveCanvas(canvas, "PT_"+seed+"_"+t, "jpg");
        saveCanvas(canvas, getTimestamp()+'_'+config.name+'_s'+String(seed)+'_cs'+String(colseed), "jpg")
        console.log("saveCanvas");
    } else if (key === 'v') {
        startVid = true;
        view = createCanvas(skw, skh);
        view.parent('container');
        reset();
    }  else if (key === 'z') {
        stopVid = true;
    }
}