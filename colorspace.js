
class ColorSpace {
    constructor(c){
        this.num = c.num || 0;
        this.dots = c.dots || [];
        this.poles = c.poles || [];
        this.forces = c.forces || [];
        this.dotConfig = c.dotConfig || {};
        this.repel = c.repel || 0;
        this.mode = c.mode || 'HSV';

        this.centroid = null;
    }

    makeRandom() {
        this.dots = [];

        for(let i=0; i<this.num; i++){
            let d = new ColorPoint(i, this, {...this.dotConfig});
            this.dots.push(d);
        }

        for(let d of this.dots) d.readForces(this.forces);
    }

    makeLine(len = 0.1, flatten = true) {
        this.dots = [];

        for(let i=0; i<this.num; i++){
            let d = new ColorPoint(i, this, {...this.dotConfig});
            this.dots.push(d);

            let fs = []
            if(i > 0){
                fs = [ {type:"spring", len:len, f:0.01, tg:this.dots[i-1]} ]
                if(flatten && i > 1) fs.push( {type:"spring", len:len*2, f:0.005, tg:this.dots[i-2]} )
            }
            d.readForces(fs);
        }

        for(let d of this.dots) d.readForces(this.forces);
    }

    makeBackAndLine(toBack = 0.5, len = 0.1, flatten = true) {
        this.dots = [];

        for(let i=0; i<this.num; i++){
            let d = new ColorPoint(i, this, {...this.dotConfig});
            this.dots.push(d);

            let fs = []
            if(i > 0){
                fs = [
                    {type:"spring", len:toBack, f:0.02, tg:this.dots[0]}
                ]
                if(i > 1) fs.push( {type:"spring", len:len, f:0.01, tg:this.dots[i-1]} )
                if(flatten && i > 2) fs.push( {type:"spring", len:len*2, f:0.005, tg:this.dots[i-2]} )
            }
            d.readForces(fs);
        }

        for(let d of this.dots) d.readForces(this.forces);
    }

    run(iterations){
        for(let i=0; i<iterations; i++){
            this.step();
        }
    }

    step(){
        let a, b, dif = createVector(), dst, linked;
        let f = 0.1;

        if(this.centroid != null){
            let sum = createVector()
            for(let d of this.dots){
                //sum.add(d.nrm[0], d.nrm[1], d.nrm[2]);
                sum.add(d.pos)
            }
            sum.div(this.num);
            this.centroid.set(sum);

            // canvas.fill(0)
            // let tx = nf(this.centroid.x, 1, 2)+"\r\n"+nf(this.centroid.y, 1, 2)+"\r\n"+nf(this.centroid.z, 1, 2);
            // canvas.text(tx, 20 + 80*this.num, 120 );
        }

        for(let i=0; i<this.num; i++){
            a = this.dots[i];
            
            if(this.repel > 0){
                for(let j=i+1; j<this.num; j++){
                    b = this.dots[j];
                    dif = this.posDif(a.pos, b.pos);
                    dst = dif.mag();
                    if(dst < this.repel){
                        dif.setMag(lerp(0.01, 0, dst/this.repel));
                        a.vel.sub(dif);
                        b.vel.add(dif);
                    }
                }
            }

            for(let pl of this.poles){
                dif.set(pl.nrm[0]- a.nrm[0], pl.nrm[1]- a.nrm[1], pl.nrm[2]- a.nrm[2])
                dst = dif.mag();

                if(dst < pl.r){
                    dif.setMag(lerp(pl.f, 0, dst/pl.r));
                    a.vel.sub(dif);
                }
            }

            a.step();
        }
    }

    getVal(n, format = 'rgb'){
        let c = this.dots[n].col;
        return format == 'rgb' ? chroma(c).rgb() : c;
    }

    getList(from = 0, to = 999, format = 'rgb') {
        let out = [];
        for(let i=from; i<min(this.dots.length, to); i++){
            let c = this.dots[i].col;
            out.push( format == 'rgb' ? chroma(c).rgb() : c );
        }
        return out;
    }

    pushAll(vec){
        for(let d of this.dots){
            d.vel.add(vec)
        }
    }

    posDif(a, b) {
        let out = createVector();
        if(this.mode == 'HSV' || this.mode == 'HSL') {
            let dx = b.x - a.x;
            out.set(
                abs(dx) > 0.5 ? (1-abs(dx)) * (dx>0 ? -1 : 1) : dx,
                b.y - a.y,
                b.z - a.z
            )
        } else {
            out.set(
                b.x - a.x,
                b.y - a.y,
                b.z - a.z
            )
        }

        return out;
    }
   
}

class ColorPoint{
    constructor(ix, space, c){
        this.ix = ix;
        this.space = space;
        // this.pos = createVector(random(1), random(-0.5, 1.5), random(-0.5, 1.5));
        this.pos = c.pos || createVector(random(1), random(1), random(1));
        this.vel = createVector();
        this.damp = c.damp || 0.92;
        this.limit = c.limit || 0.02
        this.nrm = this.normalize(this.pos);
        this.forces = [];
        this.links = [];
        this.col;
        

        //console.log(this.ix, forces)
        //this.readForces(forces);

        let pu = 0.0002
        this.push = createVector(random(-pu, pu), random(-pu, pu), random(-pu, pu));

    }

    readForces(fs) {
        for(let f of fs) {
            if(f.type == 'all'){
                this.space.repel = f.len;

            } else if(f.type == 'centroid'){
                this.space.centroid = createVector();
                this.forces.push({...f});

            } else if(f.type == 'limit'){
                this.forces.push({ax:0, val:0.5, sign:'>', f:0.1, ...f});

            } else if(f.type == 'noisepull'){
                this.forces.push({ivar:1, tvar:0.01, cn:1, f:0.01, ...f});

            } else if(f.type == 'noisepush'){
                this.forces.push({ivar:1, tvar:0.01, f:0.01, ...f});

            } else if(f.ref == 'next') {
                let nix = this.ix + (f.n || 1);
                console.log('nix', f.n, this.ix, nix);
                if(nix >= this.space.num){
                    if(f.wrap) nix %= this.space.num;
                    else return;
                }
                let tg = this.space.dots[nix];
                this.links.push(tg);
                this.forces.push({tg:tg, mutual:true, len:0.1, f:0.01, ...f})

            } else if(f.ref == 'rnd') {
                let nix = this.ix;
                do{
                    nix = int(random(this.space.num));
                } while(nix == this.ix)
                let tg = this.space.dots[nix];
                this.links.push(tg);
                this.forces.push({tg:tg, mutual:true, len:0.1, f:0.01, ...f})

            } else {
                this.forces.push({mutual:true, len:0.1, f:0.01, ...f})
                this.links.push(f.tg);
            }

        }
    }

    step(){
        let dif, dst;
        for(let f of this.forces){
            if(f.type == 'spring'){
                dif = this.posDif(this.pos, f.tg.pos);
                dif.setMag( (f.len - dif.mag()) * f.f );
                this.vel.sub(dif);
                if(f.mutual) f.tg.vel.add(dif);

            } else if(f.type == 'centroid'){
                dif = this.posDif(this.pos, this.space.centroid);
                dst = max(dif.mag(), 0.00001);
                dif.setMag(f.f / dst);
                this.vel.add(dif);

            } else if(f.type == 'limit'){
                if(f.sign == '>' && this.nrm[f.ax] > f.val ){
                    this.vel[['x','y','z'][f.ax]] += (f.val-this.nrm[f.ax]) * f.f;
                }
                if(f.sign == '<' && this.nrm[f.ax] < f.val ){
                    this.vel[['x','y','z'][f.ax]] += (f.val-this.nrm[f.ax]) * f.f;
                }

            } else if(f.type == 'noise'){
                let o = {
                    x: contrast(noise(0, this.ix*f.ivar, t*f.tvar), f.cn),
                    y: contrast(noise(5, this.ix*f.ivar, t*f.tvar), f.cn),
                    z: contrast(noise(10, this.ix*f.ivar, t*f.tvar), f.cn),
                }
                dif = this.posDif(this.pos, o);
                //console.log(this.ix, this.pos.x, o.x, dif.x);
                dif.setMag(dif.mag() * f.f);
                this.vel.add(dif);
                
            } else if(f.type == 'noisepush'){
                this.vel.add(
                    lerp(-f.f, f.f, noise(0, this.ix*f.ivar, t*f.tvar)),
                    lerp(-f.f, f.f, noise(5, this.ix*f.ivar, t*f.tvar)),
                    lerp(-f.f, f.f, noise(10, this.ix*f.ivar, t*f.tvar)),
                );
            }

        }

        this.pos.add(this.vel);
        this.vel.mult(this.damp);
        this.vel.limit(this.limit);

        this.nrm = this.normalize(this.pos);
        this.col = this.getCol(this.nrm);

        // let m = 80;
        // canvas.fill(this.col)
        // canvas.noStroke();
        // canvas.rect(20 + m*this.ix, 20, m, m);

        // canvas.fill(0)
        // let tx = nf(this.pos.x, 1, 2)+"\r\n"+nf(this.pos.y, 1, 2)+"\r\n"+nf(this.pos.z, 1, 2);
        // canvas.text(tx, 20 + m*this.ix, 120 );
    }

    getCol(nrm) {
        if(this.space.mode == 'HSV') {
            return chroma.hsv(nrm[0] * 360, nrm[1], nrm[2]).hex();
        }
        if(this.space.mode == 'HSL') {
            return chroma.hsl(nrm[0] * 360, nrm[1], nrm[2]).hex();
        }
        if(this.space.mode == 'RGB') {
            //return chroma.gl(nrm).hex();
            return chroma(nrm[0]*255, nrm[1]*255, nrm[2]*255).hex();
        }
    }

    normalize(vec) {
        if(this.space.mode == 'HSV' || this.space.mode == 'HSL') return [fract(vec.x), this.vaiven(vec.y), this.vaiven(vec.z)];
        return [this.vaiven(vec.x), this.vaiven(vec.y), this.vaiven(vec.z)];
    }

    vaiven(n) {
        if(n>1) return int(n) % 2 == 0 ? fract(n) : 1-fract(n);
        if(n<0) return int(n) % 2 == 0 ? fract(abs(n)) : 1 - fract(abs(n));
        return n;
    }

    posDif(a, b) {
        let out = createVector();
        if(this.space.mode == 'HSV' || this.space.mode == 'HSL') {
            let dx = b.x - a.x;
            out.set(
                abs(dx) > 0.5 ? (1-abs(dx)) * (dx>0 ? -1 : 1) : dx,
                b.y - a.y,
                b.z - a.z
            )
        } else {
            out.set(
                b.x - a.x,
                b.y - a.y,
                b.z - a.z
            )
        }

        return out;
    }
}