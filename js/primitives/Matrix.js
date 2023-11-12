export default class Matrix{
    constructor(){
        this.m = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0 ,1, 0,
            0, 0, 0, 1
        ]
    }

    applyToPoint(p){
        return {
            x:this.m[0]*p.x + this.m[4]*p.y + this.m[8]*p.z  + this.m[12],
            y:this.m[1]*p.x + this.m[5]*p.y + this.m[9]*p.z  + this.m[13],
            z:this.m[2]*p.x + this.m[6]*p.y + this.m[10]*p.z + this.m[14]
        }
    }

    applyToNormal(n){
        return {
            x:this.m[0]*n.x + this.m[4]*n.y + this.m[8]*n.z,
            y:this.m[1]*n.x + this.m[5]*n.y + this.m[9]*n.z,
            z:this.m[2]*n.x + this.m[6]*n.y + this.m[10]*n.z 
        }
    }

    transform(translation, rotation, scale=[1,1,1]){
        this.translate(...translation)
        this.rotate(...rotation)
        this.scale(...scale)
        return this
    }

    translate(x,y,z){
        this.m = [
            this.m[0],    this.m[1],    this.m[2],    this.m[3],
            this.m[4],    this.m[5],    this.m[6],    this.m[7],
            this.m[8],    this.m[9],    this.m[10],   this.m[11],
            this.m[12]+x, this.m[13]+y, this.m[14]+z, this.m[15],
        ]
        return this
    }

    scale(x,y,z){
        this.m = [
            this.m[0]*x,  this.m[1]*x,  this.m[2]*x,  this.m[3],
            this.m[4]*y,  this.m[5]*y,  this.m[6]*y,  this.m[7],
            this.m[8]*z,  this.m[9]*z,  this.m[10]*z, this.m[11],
            this.m[12],   this.m[13],   this.m[14],   this.m[15],
        ]
        return this
    }

    // Euler angle order : X then Y then Z
    rotate(x,y,z){
        // X
        let m = this.m
        let sin = Math.sin(x*(Math.PI/180))
        let cos = Math.cos(x*(Math.PI/180))
        this.m = [
            m[0],                m[1],                 m[2],                 m[3],
            m[4]*cos + m[8]*sin, m[5]*cos + m[9]*sin,  m[6]*cos + m[10]*sin, m[7]*cos + m[11]*sin,
            m[8]*cos - m[4]*sin, m[9]*cos - m[5]*sin,  m[10]*cos - m[6]*sin, m[11]*cos - m[7]*sin,
            m[12],               m[13],                m[14],                m[15],
        ]
        // Y
        m = this.m
        sin = Math.sin(y*(Math.PI/180))
        cos = Math.cos(y*(Math.PI/180))
        this.m = [
            m[0]*cos - m[8]*sin, m[1]*cos - m[9]*sin,   m[2]*cos - m[10]*sin, m[3]*cos - m[11]*sin,
            m[4],                m[5],                  m[6],                 m[7],
            m[8]*cos + m[0]*sin, m[9]*cos + m[1]*sin,   m[10]*cos + m[2]*sin, m[11]*cos + m[3]*sin,
            m[12],               m[13],                 m[14],                m[15],
        ]
        // Z
        m = this.m
        sin = Math.sin(z*(Math.PI/180))
        cos = Math.cos(z*(Math.PI/180))
        this.m = [
            m[0]*cos + m[4]*sin, m[1]*cos + m[5]*sin,   m[2]*cos + m[6]*sin, m[3]*cos + m[7]*sin,
            m[4]*cos - m[0]*sin, m[5]*cos - m[1]*sin,   m[6]*cos - m[2]*sin, m[7]*cos - m[3]*sin,
            m[8],                m[9],                  m[10],               m[11],
            m[12],               m[13],                 m[14],               m[15],
        ]
        return this
    }
}