import { Vec3 } from "./primitives.js"

export function hitDispatch(obj, ray){
    switch(obj.name){
        case "Sphere":
            return Sphere.hit(obj, ray)
        case "Triangle":
            return Triangle.hit(obj, ray)
        default:
            console.error(`Unknown object : ${obj}`)
    }
}

export function normalAtDispatch(obj, position){
    switch(obj.name){
        case "Sphere":
            return Sphere.normalAt(obj, position)
        case "Triangle":
            return Triangle.normalAt(obj, position)
        default :
            console.error(`Unknown object : ${obj}`)
    }
}

export class Sphere{
    constructor(){console.error("Sphere has no constructor !")}

    static new(center, radius){
        return {name:"Sphere", center:center, radius:radius}
    }

    static hit(self, ray){
        const diff = Vec3.sub( Vec3.clone(ray.origin), self.center)
        const a = Vec3.dot(ray.direction, ray.direction)
        const b = 2*Vec3.dot(ray.direction, diff)
        const c = Vec3.dot(diff, diff) - self.radius*self.radius
        const discriminant = b*b - 4*a*c
        if(discriminant >= 0){
            const t = (-b-Math.sqrt(discriminant))/(2*a)
            return t > 0.0001 ? t : Infinity
        }else{
            return Infinity
        }
    }

    static normalAt(self, position){
        return Vec3.normalize(Vec3.sub(Vec3.clone(position), self.center))
    }
}

export class Triangle{
    constructor(){console.error("Triangle has no constructor !")}

    static new(p1, p2, p3){
        return {name:"Triangle", p1:p1, p2:p2, p3:p3}
    }

    static hit(self, ray){
        let p1 = Vec3.clone(self.p1)
        let p2 = Vec3.clone(self.p2)
        let p3 = Vec3.clone(self.p3)
        // Translate
        Vec3.sub(p1, ray.origin)
        Vec3.sub(p2, ray.origin)
        Vec3.sub(p3, ray.origin)
        // Permute
        let max = Math.max(
            Math.abs(ray.direction.x), 
            Math.abs(ray.direction.y), 
            Math.abs(ray.direction.z), 
        )
        if(max == ray.direction.x){
            [p1.x, p1.z] = [p1.z, p1.x]
            [p2.x, p2.z] = [p2.z, p2.x]
            [p3.x, p3.z] = [p3.z, p3.x]
        }else if(max == ray.direction.y){
            [p1.y, p1.z] = [p1.z, p1.y]
            [p2.y, p2.z] = [p2.z, p2.y]
            [p3.y, p3.z] = [p3.z, p3.y]
        }
        // Shear
        const sx = -ray.direction.x / ray.direction.z
        const sy = -ray.direction.y / ray.direction.z
        const sz = 1 / ray.direction.z
        p1.x += sx * p1.z
        p1.y += sy * p1.z
        p2.x += sx * p2.z
        p2.y += sy * p2.z
        p3.x += sx * p3.z
        p3.y += sy * p3.z

        // difference of products
        let e1 = p2.x*p3.y - p2.y*p3.x
        let e2 = p3.x*p1.y - p3.y*p1.x
        let e3 = p1.x*p2.y - p1.y*p2.x

        if( (e1 < 0 || e2 < 0 || e3 < 0) && (e1 > 0 || e2 > 0 || e3 > 0) ){
            return Infinity
        }
        let det = e1 + e2 + e3
        if(det == 0){
            return Infinity
        }

        p1.z *= sz
        p2.z *= sz
        p3.z *= sz

        let tScaled = e1 * p1.z + e2 * p2.z + e3*p3.z
        if(det < 0 && tScaled <= 0){
            return Infinity
        }else if( det > 0 && tScaled <= 0){
            return Infinity
        }

        return tScaled / det
    }

    static normalAt(self, position){
        let p2 = Vec3.clone(self.p2)
        let p3 = Vec3.clone(self.p3)
        Vec3.sub(p2, self.p1)
        Vec3.sub(p3, self.p1)
        Vec3.cross(p2, p3)
        return Vec3.normalize(p2)
    }
}
