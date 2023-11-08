import { Vec3 } from "../../../primitives.js"

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
        self.radiusSquared = self.radius*self.radius
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
            if(obj.sbox.center.x < minX) minX = obj.sbox.center.x 
            if(obj.sbox.center.x > maxX) maxX = obj.sbox.center.x 
            if(obj.sbox.center.y < minY) minY = obj.sbox.center.y
            if(obj.sbox.center.y > maxY) maxY = obj.sbox.center.y 
            if(obj.sbox.center.z < minZ) minZ = obj.sbox.center.z 
            if(obj.sbox.center.z > maxZ) maxZ = obj.sbox.center.z 
        }

        const center = Vec3.new( (minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2)


        const deltaX = Math.abs(minX - maxX) 
        const deltaY = Math.abs(minY - maxY)
        const deltaZ = Math.abs(minZ - maxZ)

        Sbox.set(self, center, Vec3.norm(Vec3.new(deltaX/2, deltaY/2, deltaZ/2)))

        const maxDelta = Math.max(deltaX, deltaY, deltaZ)
        if(maxDelta == deltaX){
            self.splitAxis = 'x'
            self.splitAxisStart = minX
            self.splitAxisEnd = maxX
        }else if(maxDelta == deltaY){
            self.splitAxis = 'y'
            self.splitAxisStart = minY
            self.splitAxisEnd = maxY
        }else{
            self.splitAxis = 'z'
            self.splitAxisStart = minZ
            self.splitAxisEnd = maxZ
        }
        return self
    }

    static getEnglobing(self, objs){
        for(let i=0; i<objs.length; i++){
            Sbox.merge(self, objs[i].sbox)
        }
        return self
    }

    static mergeCenter(self, other){
        if(self.radius == 0){
            Sbox.set(self, other.center, other.radius)
            return self
        }
        if(other.radius == 0){
            return self
        }

        const minX = Math.min(self.center.x , other.center.x)
        const maxX = Math.max(self.center.x , other.center.x )
        const minY = Math.min(self.center.y , other.center.y )
        const maxY = Math.max(self.center.y , other.center.y )
        const minZ = Math.min(self.center.z , other.center.z )
        const maxZ = Math.max(self.center.z , other.center.z )

        const center = Vec3.new( (minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2)

        const distSelf = Vec3.norm(Vec3.sub(Vec3.clone(center), self.center))
        const distOther = Vec3.norm(Vec3.sub(Vec3.clone(center), other.center))
        if(distSelf < distOther){
            Sbox.set(self, center, distOther)
        }else{
            Sbox.set(self, center, distSelf)
        } 
        return self   
    }

    static merge(self, other){
        if(self.radius == 0){
            Sbox.set(self, other.center, other.radius)
            return self
        }
        if(other.radius == 0){
            return self
        }

        const minX = Math.min(self.center.x - self.radius, other.center.x - other.radius)
        const maxX = Math.max(self.center.x + self.radius, other.center.x + other.radius)
        const minY = Math.min(self.center.y - self.radius, other.center.y - other.radius)
        const maxY = Math.max(self.center.y + self.radius, other.center.y + other.radius)
        const minZ = Math.min(self.center.z - self.radius, other.center.z - other.radius)
        const maxZ = Math.max(self.center.z + self.radius, other.center.z + other.radius)

        const center = Vec3.new( (minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2)

        const distSelf = Vec3.norm(Vec3.sub(Vec3.clone(center), self.center))
        const distOther = Vec3.norm(Vec3.sub(Vec3.clone(center), other.center))
        if(distSelf+self.radius < distOther+other.radius){
            Sbox.set(self, center, distOther+other.radius)
        }else{
            Sbox.set(self, center, distSelf+self.radius)
        } 
        return self        

    }

    static surfaceArea(self){
        return 4*Math.PI*self.radius*self.radius
    }

    static hitRay(self, ray){
        const diffX = ray.origin.x - self.center.x
        const diffY = ray.origin.y - self.center.y
        const diffZ = ray.origin.z - self.center.z
        const b = ray.direction.x*diffX + ray.direction.y*diffY + ray.direction.z*diffZ
        const c = diffX*diffX + diffY*diffY + diffZ*diffZ - self.radiusSquared
        return b*b >= ray.DotDirection*c
    }
}