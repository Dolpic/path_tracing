import { Vec3 } from "../../primitives.js"

export class Sbox{

    static new(center, radius){
        const self = {
            center: Vec3.new(),
            radius: 0
        }
        return Sbox.set(self, center, radius)
    }

    static set(self, center, radius){
        Vec3.equal(self.center, center)
        self.radius = radius
        return self
    }

    static reset(self){
        self.center.x = 0
        self.center.y = 0
        self.center.z = 0
        self.radius = 0
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
        const center = Vec3.new((minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2)
        const distX = Math.max( Math.abs(minX - center.x), Math.abs(maxX - center.x) )
        const distY = Math.max( Math.abs(minY - center.y), Math.abs(maxY - center.y) )
        const distZ = Math.max( Math.abs(minZ - center.z), Math.abs(maxZ - center.z) )
        return Sbox.set(self, center, Math.max(distX, distY, distZ))
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
            if(obj.sbox.center.x-obj.sbox.radius < minX) minX = obj.sbox.center.x-obj.sbox.radius
            if(obj.sbox.center.x+obj.sbox.radius > maxX) maxX = obj.sbox.center.x+obj.sbox.radius
            if(obj.sbox.center.y-obj.sbox.radius < minY) minY = obj.sbox.center.y-obj.sbox.radius
            if(obj.sbox.center.y+obj.sbox.radius > maxY) maxY = obj.sbox.center.y+obj.sbox.radius
            if(obj.sbox.center.z-obj.sbox.radius < minZ) minZ = obj.sbox.center.z-obj.sbox.radius
            if(obj.sbox.center.z+obj.sbox.radius > maxZ) maxZ = obj.sbox.center.z+obj.sbox.radius
        }
        const center = Vec3.new((minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2)
        const distX = Math.max( Math.abs(minX - center.x), Math.abs(maxX - center.x) )
        const distY = Math.max( Math.abs(minY - center.y), Math.abs(maxY - center.y) )
        const distZ = Math.max( Math.abs(minZ - center.z), Math.abs(maxZ - center.z) )
        return Sbox.set(self, center, Math.max(distX, distY, distZ))
    }

    static merge(self, other){

        if(self.radius == 0){
            Sbox.set(self, other.center, other.radius)
            return self 
        }
        
        const center = Vec3.new( 
            (self.center.x+other.center.x)/2,
            (self.center.y+other.center.y)/2,
            (self.center.z+other.center.z)/2
        )
        
        const radius = Math.max(
            Math.abs(center.x - (self.center.x+self.radius)),
            Math.abs(center.x - (self.center.x-self.radius)),
            Math.abs(center.x - (other.center.x+self.radius)),
            Math.abs(center.x - (other.center.x-self.radius)),

            Math.abs(center.y - (self.center.y+self.radius)),
            Math.abs(center.y - (self.center.y-self.radius)),
            Math.abs(center.y - (other.center.y+self.radius)),
            Math.abs(center.y - (other.center.y-self.radius)),

            Math.abs(center.z - (self.center.z+self.radius)),
            Math.abs(center.z - (self.center.z-self.radius)),
            Math.abs(center.z - (other.center.z+self.radius)),
            Math.abs(center.z - (other.center.z-self.radius)),
        )

        Sbox.set(self, center, radius)
        return self
    }

    static surfaceArea(self){
        return 4*Math.PI*self.radius*self.radius
    }

    static hitRay(self, ray){
        const diff = Vec3.sub( Vec3.clone(ray.origin), self.center)
        const a = Vec3.dot(ray.direction, ray.direction)
        const b = 2*Vec3.dot(ray.direction, diff)
        const c = Vec3.dot(diff, diff) - self.radius*self.radius
        return b*b - 4*a*c >= 0
    }
}