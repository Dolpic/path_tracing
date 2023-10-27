export class Ray {
    constructor(){console.error("Ray has no constructor !")}

    static new(origin, direction, color){
        return {
            origin:origin, 
            direction:direction,
            color:color
        }
    }

    static moveAt(ray, t){
        ray.origin.x += ray.direction.x * t
        ray.origin.y += ray.direction.y * t
        ray.origin.z += ray.direction.z * t
    }

    static at(ray, t){
        return Vec3.new(
            ray.direction.x * t,
            ray.direction.y * t,
            ray.direction.z * t
        )
    }
}

export class Vec3 {
    constructor(){console.error("Vec3 has no constructor !")}

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
        let tmp_x = self.x
        let tmp_y = self.y
        let tmp_z = self.z
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
        let norm = Vec3.norm(self)
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
    constructor(){console.error("Color has no constructor !")}

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

    static add(self, other){
        self.r += other.r
        self.g += other.g
        self.b += other.b
        self.a += other.a
        return self
    }

    static mul(self, other){
        self.r *= other.r
        self.g *= other.g
        self.b *= other.b
        self.a *= other.a
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

    static ZERO = {r:0, g:0, b:0, a:0}
}

export class Bbox{

    static fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ){
        self.minX = minX,
        self.maxX = maxX,
        self.minY = minY,
        self.maxY = maxY,
        self.minZ = minZ,
        self.maxZ = maxZ,
        self.center = Vec3.new((maxX+minX)/2, (maxY+minY)/2, (maxZ+minZ)/2)
        self.diagonal = Vec3.new( maxX-minX, maxY-minY, maxZ-minZ)
        return self
    }

    static new(p1=null, p2=null){
        if(p1 == null) p1 = Vec3.new(0,0,0)
        if(p2 == null) p2 = Vec3.new(0,0,0)
        return Bbox.fromMinMax({},
            Math.min(p1.x, p2.x),
            Math.max(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.max(p1.y, p2.y),
            Math.min(p1.z, p2.z),
            Math.max(p1.z, p2.z),
        )
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


    static hitRay(bbox, ray){

        const xInverse = 1 / ray.direction.x
        let tNearX = (bbox.minX - ray.origin.x) * xInverse
        let tFarX  = (bbox.maxX - ray.origin.x) * xInverse
        if(tNearX > tFarX){
            [tNearX, tFarX] = [tFarX, tNearX]
        }

        const yInverse = 1 / ray.direction.y
        let tNearY = (bbox.minY - ray.origin.y) * yInverse
        let tFarY  = (bbox.maxY - ray.origin.y) * yInverse
        if(tNearY > tFarY){
            [tNearY, tFarY] = [tFarY, tNearY]
        }

        const zInverse = 1 / ray.direction.z
        let tNearZ = (bbox.minZ - ray.origin.z) * zInverse
        let tFarZ  = (bbox.maxZ - ray.origin.z) * zInverse
        if(tNearZ > tFarZ){
            [tNearZ, tFarZ] = [tFarZ, tNearZ]
        }

        return Math.max(tNearX, tNearY, tNearZ) < Math.min(tFarX, tFarY, tFarZ)
    }

    /*static hitRay(bbox, ray){
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
            min = min < tFarY ? min : tFarY
            max = max > tNearY ? max : tNearY
        }else{
            min = min < tNearY ? min : tNearY
            max = max > tFarY ? max : tFarY
        }

        //if(max < min) return false

        const zInverse = 1 / ray.direction.z
        const tNearZ = (bbox.minZ - ray.origin.z) * zInverse
        const tFarZ  = (bbox.maxZ - ray.origin.z) * zInverse

        if(tNearZ > tFarZ){
            min = min < tFarZ ? min : tFarZ
            max = max > tNearZ ? max : tNearZ
        }else{
            min = min < tNearZ ? min : tNearZ
            max = max > tFarZ ? max : tFarZ
        }

        return min < max
    }*/

    static surfaceArea(self){
        return 2* (self.diagonal.x * self.diagonal.y + self.diagonal.x * self.diagonal.z + self.diagonal.y * self.diagonal.z)
    }
}