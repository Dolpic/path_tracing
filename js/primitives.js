export class Ray {
    constructor(origin, direction){
        this.defaultOrigin = Vec3.clone(origin)
        this.origin        = Vec3.clone(origin)
        this.direction     = Vec3.clone(direction)
        this.color         = Color.new()
        this.pathWeight    = Color.new(1,1,1,1)
    }

    reset(direction){
        this.setOrigin(this.defaultOrigin)
        this.setDirection(direction)
        Vec3.equal(this.direction,   direction)
        Color.equal(this.color,      Color.ZERO)
        Color.equal(this.pathWeight, Color.ONE)
    }

    setOrigin(origin){
        Vec3.equal(this.origin, origin)
        return this
    }

    setDirection(direction){
        Vec3.equal(this.direction, direction)
        return this
    }

    addToThroughput(color){
        Color.add(this.color, Color.mul( Color.clone(color), this.pathWeight))
    }

    updatePathWeight(factor){
        Color.mul(this.pathWeight, factor)
    }

    moveOriginAt(t){
        this.origin.x += this.direction.x * t
        this.origin.y += this.direction.y * t
        this.origin.z += this.direction.z * t
    }

    at(t){
        return Vec3.new(
            this.direction.x * t,
            this.direction.y * t,
            this.direction.z * t
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
    static random_spheric(self){
        Vec3.random(self)
        while(Vec3.norm(self) > 1){
            Vec3.random(self)
        }
        return self
    }
}

export class Color{

    static new(r=0, g=0, b=0, a=1){
        return {r:r, g:g, b:b, a:a}
    }

    static clone(other){
        return {
            r:other.r, 
            g:other.g, 
            b:other.b, 
            a:other.a
        }
    }

    static equal(self, other){
        self.r = other.r
        self.g = other.g
        self.b = other.b
        self.a = other.a
    }

    static isNearZero(self){
        return (
            Math.abs(self.r) < 0.0001 && 
            Math.abs(self.g) < 0.0001 && 
            Math.abs(self.b) < 0.0001 && 
            Math.abs(self.a) < 0.0001
        )
    }

    static add(self, other){
        self.r += other.r
        self.g += other.g
        self.b += other.b
        self.a += other.a
        return self
    }

    static addScalar(self, other, with_alpha=false){
        self.r += other
        self.g += other
        self.b += other
        if(with_alpha) self.a += other
        return self
    }

    static mul(self, other){
        self.r *= other.r
        self.g *= other.g
        self.b *= other.b
        self.a *= other.a
        return self
    }

    static mulScalar(self, scalar, with_alpha=false){
        self.r *= scalar
        self.g *= scalar
        self.b *= scalar
        if(with_alpha) self.a *= scalar
        return self
    }

    static div(self, scalar){
        self.r /= scalar
        self.g /= scalar
        self.b /= scalar
        self.a /= scalar
        return self
    }

    static gamma_correct(self){
        self.r = Math.sqrt(self.r)
        self.g = Math.sqrt(self.g)
        self.b = Math.sqrt(self.b)
        return self
    }

    static ZERO = {r:0, g:0, b:0, a:1}
    static ONE =  {r:1, g:1, b:1, a:1}
}

export class Bbox{

    static fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ){
        self.minX = minX
        self.maxX = maxX
        self.minY = minY
        self.maxY = maxY
        self.minZ = minZ
        self.maxZ = maxZ
        Vec3.set(self.center, (self.maxX+self.minX)/2, (self.maxY+self.minY)/2, (self.maxZ+self.minZ)/2)
        return self
    }

    static new(p1=null, p2=null){
        const self = {
            center: Vec3.new(),
            diagonal: Vec3.new()
        }
        if(p1 == null || p2 == null){
            return Bbox.reset(self)
        }else{
            return Bbox.fromMinMax(self,
                Math.min(p1.x, p2.x),
                Math.max(p1.x, p2.x),
                Math.min(p1.y, p2.y),
                Math.max(p1.y, p2.y),
                Math.min(p1.z, p2.z),
                Math.max(p1.z, p2.z),
            )
        }
    }

    static reset(self){
        self.minX = Infinity
        self.minY = Infinity
        self.minZ = Infinity
        self.maxX = -Infinity
        self.maxY = -Infinity
        self.maxZ = -Infinity
        Vec3.set(self.center, 0,0,0)
        return self
    }

    static getEnglobingCenters(self, objs){
        let minX = Infinity
        let minY = Infinity
        let minZ = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        let maxZ = -Infinity
        for(let i=0; i<objs.length; i++){
            const obj = objs[i]
            if(obj.bbox.center.x < minX) minX = obj.bbox.center.x 
            if(obj.bbox.center.x > maxX) maxX = obj.bbox.center.x 
            if(obj.bbox.center.y < minY) minY = obj.bbox.center.y
            if(obj.bbox.center.y > maxY) maxY = obj.bbox.center.y 
            if(obj.bbox.center.z < minZ) minZ = obj.bbox.center.z 
            if(obj.bbox.center.z > maxZ) maxZ = obj.bbox.center.z 
        }
        return Bbox.fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ)
    }

    static getEnglobing(self, objs){
        let minX = Infinity
        let minY = Infinity
        let minZ = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        let maxZ = -Infinity
        for(let i=0; i<objs.length; i++){
            const obj = objs[i]
            if(obj.bbox.minX < minX) minX = obj.bbox.minX
            if(obj.bbox.maxX > maxX) maxX = obj.bbox.maxX
            if(obj.bbox.minY < minY) minY = obj.bbox.minY
            if(obj.bbox.maxY > maxY) maxY = obj.bbox.maxY
            if(obj.bbox.minZ < minZ) minZ = obj.bbox.minZ
            if(obj.bbox.maxZ > maxZ) maxZ = obj.bbox.maxZ
        }
        return Bbox.fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ)
    }

    static merge(self, other){
        if(other.minX < self.minX) self.minX = other.minX
        if(other.maxX > self.maxX) self.maxX = other.maxX
        if(other.minY < self.minY) self.minY = other.minY
        if(other.maxY > self.maxY) self.maxY = other.maxY
        if(other.minZ < self.minZ) self.minZ = other.minZ
        if(other.maxZ > self.maxZ) self.maxZ = other.maxZ
        Vec3.set(self.center, (self.maxX+self.minX)/2, (self.maxY+self.minY)/2, (self.maxZ+self.minZ)/2)
        return self
    }

    static surfaceArea(self){
        const diag_x = self.maxX-self.minX
        const diag_y = self.maxY-self.minY
        const diag_z = self.maxZ-self.minZ
        return 2* (diag_x * diag_y + diag_x * diag_z + diag_y * diag_z)
    }

    static hitRay(bbox, ray){
        let min
        let max

        const xInverse = 1 / ray.direction.x
        const tNearX = (bbox.minX - ray.origin.x) * xInverse
        const tFarX  = (bbox.maxX - ray.origin.x) * xInverse

        if(tNearX > tFarX){
            min = tFarX
            max = tNearX
        }else{
            min = tNearX
            max = tFarX
        }

        const yInverse = 1 / ray.direction.y
        const tNearY = (bbox.minY - ray.origin.y) * yInverse
        const tFarY  = (bbox.maxY - ray.origin.y) * yInverse

        if(tNearY > tFarY){
            min = min < tFarY  ? tFarY  : min
            max = max > tNearY ? tNearY : max
        }else{
            min = min < tNearY ? tNearY : min
            max = max > tFarY  ? tFarY  : max
        }

        if(max < min) return false

        const zInverse = 1 / ray.direction.z
        const tNearZ = (bbox.minZ - ray.origin.z) * zInverse
        const tFarZ  = (bbox.maxZ - ray.origin.z) * zInverse

        if(tNearZ > tFarZ){
            min = min < tFarZ  ? tFarZ  : min
            max = max > tNearZ ? tNearZ : max
        }else{
            min = min < tNearZ ? tNearZ : min
            max = max > tFarZ  ? tFarZ  : max
        }

        return min < max
    }
}