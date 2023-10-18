import { Vec3 } from "./primitives.js"

export function hitDispatch(obj, ray){
    switch(obj.name){
        case "Sphere":
            return Sphere.hit(ray, obj)
        case "Triangle":
            return Triangle.hit(ray, obj)
        default:
            console.error("Unknown object : ")
            console.error(obj)
    }
}

export function normalAtDispatch(obj, position){
    switch(obj.name){
        case "Sphere":
            return Sphere.normalAt(position, obj)
        case "Triangle":
            return Triangle.normalAt(position, obj)
        default :
            console.error("Unknown object : ")
            console.error(obj)
    }
}

export class Sphere{
    constructor(center, radius){
        this.name   = "Sphere"
        this.center = center
        this.radius = radius
    }

    static hit(ray, obj){
        let center = new Vec3(obj.center.x, obj.center.y, obj.center.z)

        let diff = ray.origin.sub(center)
        let a = ray.direction.dot(ray.direction)
        let b = 2*ray.direction.dot(diff)
        let c = diff.dot(diff) - obj.radius*obj.radius
        let discriminant = b*b - 4*a*c
        if(discriminant >= 0){
            let t  = (-b-Math.sqrt(discriminant))/(2*a)
            return t > 0.0001 ? t : Infinity
        }else{
            return Infinity
        }
    }

    static normalAt(position, obj){
        let center = new Vec3(obj.center.x, obj.center.y, obj.center.z)
        return position.sub(center).normalized()
    }
}

export class Triangle{
    constructor(p1, p2, p3){
        this.name = "Triangle"
        this.p1 = p1
        this.p2 = p2
        this.p3 = p3
    }

    static hit(ray, obj){
        let p1 = new Vec3(obj.p1.x, obj.p1.y, obj.p1.z)
        let p2 = new Vec3(obj.p2.x, obj.p2.y, obj.p2.z)
        let p3 = new Vec3(obj.p3.x, obj.p3.y, obj.p3.z)
        // Translate
        p1 = p1.sub(ray.origin)
        p2 = p2.sub(ray.origin)
        p3 = p3.sub(ray.origin)
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
        let sx = -ray.direction.x / ray.direction.z
        let sy = -ray.direction.y / ray.direction.z
        let sz = 1 / ray.direction.z
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

    static normalAt(position, obj){
        let p1 = new Vec3(obj.p1.x, obj.p1.y, obj.p1.z)
        let p2 = new Vec3(obj.p2.x, obj.p2.y, obj.p2.z)
        let p3 = new Vec3(obj.p3.x, obj.p3.y, obj.p3.z)

        let v1 = p2.sub(p1)
        let v2 = p3.sub(p1)
        let res = new Vec3( // Cross product
            v1.y*v2.z - v1.z*v2.y,
            v1.z*v2.x - v1.x*v2.z,
            v1.x*v2.y - v1.y*v2.x
        )
        return res.normalized()
    }
}
