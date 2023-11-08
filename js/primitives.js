export class Ray {
    constructor(origin, direction){
        this.defaultOrigin = Vec3.clone(origin)
        this.origin        = Vec3.clone(origin)
        this.color         = Color.new()
        this.pathWeight    = Color.new(1,1,1)
        this.direction    = Vec3.new(0,0,0)
        this.setDirection(Vec3.clone(Vec3.normalize(direction)))
    }

    reset(direction){
        this.setOrigin(this.defaultOrigin)
        this.setDirection(direction)
        Color.equal(this.color,      Color.ZERO)
        Color.equal(this.pathWeight, Color.ONE)
    }

    setOrigin(origin){
        Vec3.equal(this.origin, origin)
        return this
    }

    setDirection(direction){
        Vec3.equal(this.direction, Vec3.normalize(direction))
        this.DotDirection = Vec3.dot(this.direction, this.direction)
        return this
    }

    getDirection(){
        return this.direction
    }

    addToThroughput(color){
        Color.add(this.color, Color.mul( Color.clone(color), this.pathWeight))
    }

    updatePathWeight(factor){
        Color.mul(this.pathWeight, factor)
    }

    moveOriginAt(t){
        this.origin.x += this.getDirection().x * t
        this.origin.y += this.getDirection().y * t
        this.origin.z += this.getDirection().z * t
    }

    at(t){
        return Vec3.new(
            this.getDirection().x * t,
            this.getDirection().y * t,
            this.getDirection().z * t
        )
    } 
}

export class Complex {
    static new(real, img){
        return {r:real, i:img}
    }

    static clone(c){
        return {r:c.r, i:c.i}
    }

    static fromReal(real){
        return Complex.new(real, 0)
    }

    static add(self, other){
        self.r = self.r + other.r
        self.i = self.i + other.i
        return self
    }

    static sub(self, other){
        self.r = self.r - other.r
        self.i = self.i - other.i
        return self
    }

    static mul(self, other){
        const selfR = self.r
        self.r = selfR * other.r - self.i * other.i
        self.i = selfR * other.i + self.i * other.r
        return self
    }

    static div(self, other){
        const denominator = other.r*other.r + other.i*other.i
        const selfR = self.r
        self.r = (selfR*other.r + self.i*other.i) / denominator
        self.i = (other.r*self.i - selfR*other.i) / denominator
        return self
    }

    static sqrt(self){
        if(self.i == 0){
            if(self.r > 0){
                self.r = Math.sqrt(self.r)
            }else{
                self.r = 0
                self.i = Math.sqrt(-self.r)
            }
        }else{
            const r = self.r
            const modulus = Complex.modulus(self)
            self.r = Math.sqrt( (r + modulus)/2 )
            self.i = Math.sqrt( (-r + modulus)/2 ) * Math.sign(self.i)
        }
        return self
    }

    static modulus(self){
       return Math.sqrt(Complex.modulusSquared(self))
    }

    static modulusSquared(self){
        return self.r*self.r + self.i*self.i
    }
}

export class Vec3 {

    static new(x=0, y=0, z=0){
        return {x:x, y:y, z:z}
    }

    static clone(self){
        return {x:self.x, y:self.y, z:self.z}
    }

    static equal(self, other){
        self.x = other.x
        self.y = other.y
        self.z = other.z
        return self
    }

    static set(self, x, y, z){
        self.x = x
        self.y = y
        self.z = z
        return self
    }

    static mul(self, other){
        self.x *= other.x
        self.y *= other.y
        self.z *= other.z
        return self
    }

    static mulScalar(self, scalar){
        self.x *= scalar
        self.y *= scalar
        self.z *= scalar
        return self
    }

    static sub(self, other){
        self.x -= other.x
        self.y -= other.y
        self.z -= other.z
        return self
    }

    static subScalar(self, scalar){
        self.x -= scalar
        self.y -= scalar
        self.z -= scalar
        return self
    }

    static add(self, other){
        self.x += other.x
        self.y += other.y
        self.z += other.z
        return self
    }

    static addScalar(self, scalar){
        self.x += scalar
        self.y += scalar
        self.z += scalar
        return self
    }

    static cross(self, other){
        const tmp_x = self.x
        const tmp_y = self.y
        const tmp_z = self.z
        self.x = tmp_y*other.z - tmp_z*other.y
        self.y = tmp_z*other.x - tmp_x*other.z
        self.z = tmp_x*other.y - tmp_y*other.x
        return self
    }

    static dot(self, other){
        return self.x * other.x + self.y * other.y + self.z * other.z
    }

    static norm(self){
        return Math.sqrt(Vec3.norm_squared(self))
    }

    static norm_squared(self){
        return self.x*self.x + self.y*self.y + self.z*self.z
    }

    static normalize(self){
        const norm = Vec3.norm(self)
        self.x /= norm
        self.y /= norm
        self.z /= norm
        return self
    }

    static random(self){
        self.x = Math.random()*2-1
        self.y = Math.random()*2-1
        self.z = Math.random()*2-1
    }

    // Can be improved but ok for now
    static randomSpheric(self){
        Vec3.random(self)
        while(Vec3.norm(self) > 1){
            Vec3.random(self)
        }
        return self
    }

    static randomOnUnitSphere(self){
        Vec3.normalize(Vec3.randomSpheric(self))
        return self
    }
}

export class Color{

    static new(r=0, g=0, b=0){
        return {r:r, g:g, b:b}
    }

    static clone(other){
        return {
            r:other.r, 
            g:other.g, 
            b:other.b
        }
    }

    static equal(self, other){
        self.r = other.r
        self.g = other.g
        self.b = other.b
        return self
    }

    static isNearZero(self){
        return (
            Math.abs(self.r) < 0.0001 && 
            Math.abs(self.g) < 0.0001 && 
            Math.abs(self.b) < 0.0001
        )
    }

    static add(self, other){
        self.r += other.r
        self.g += other.g
        self.b += other.b
        return self
    }

    static addScalar(self, other){
        self.r += other
        self.g += other
        self.b += other
        return self
    }

    static mul(self, other){
        self.r *= other.r
        self.g *= other.g
        self.b *= other.b
        return self
    }

    static mulScalar(self, scalar){
        self.r *= scalar
        self.g *= scalar
        self.b *= scalar
        return self
    }

    static div(self, scalar){
        self.r /= scalar
        self.g /= scalar
        self.b /= scalar
        return self
    }

    static gamma_correct(self){
        self.r = Math.sqrt(self.r)
        self.g = Math.sqrt(self.g)
        self.b = Math.sqrt(self.b)
        return self
    }

    static ZERO = {r:0, g:0, b:0}
    static ONE =  {r:1, g:1, b:1}
}
