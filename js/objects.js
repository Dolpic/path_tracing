import { Bbox, Vec3 } from "./primitives.js"

export class Sphere{
    constructor(center, radius){
        this.name = "Sphere"
        this.center = center
        this.radius = radius
        this.bbox = Bbox.new( 
            Vec3.subScalar(Vec3.clone(center), this.radius), 
            Vec3.addScalar(Vec3.clone(center), this.radius)
        )
    }

    static unSerialize(sphere){
        return new Sphere(sphere.center, sphere.radius)
    }

    getBbox(){
        return this.bbox
    }

    hit(ray){
        const diff = Vec3.sub( Vec3.clone(ray.origin), this.center)
        const a = Vec3.dot(ray.direction, ray.direction)
        const b = 2*Vec3.dot(ray.direction, diff)
        const c = Vec3.dot(diff, diff) - this.radius*this.radius
        const discriminant = b*b - 4*a*c
        if(discriminant >= 0){
            const t = (-b-Math.sqrt(discriminant))/(2*a)
            return t > 0.0001 ? t : Infinity
        }else{
            return Infinity
        }
    }

    normalAt(position){
        return Vec3.normalize(Vec3.sub(Vec3.clone(position), this.center))
    }
}

export class Triangle{
    constructor(p1, p2, p3){
        this.name = "Triangle"
        this.p1 = p1
        this.p2 = p2
        this.p3 = p3

        this.n12 = Vec3.sub( Vec3.clone(this.p2), this.p1)
        this.n23 = Vec3.sub( Vec3.clone(this.p3), this.p2)
        this.n31 = Vec3.sub( Vec3.clone(this.p1), this.p3)
        this.normal = Vec3.cross( Vec3.clone(this.n12), this.n23)

        Vec3.cross(this.n12, this.normal)
        Vec3.cross(this.n23, this.normal)
        Vec3.cross(this.n31, this.normal)
        this.d = - (this.normal.x*this.p1.x + this.normal.y*this.p1.y + this.normal.z*this.p1.z)

        this.d1 = Vec3.new(0,0,0)
        this.d2 = Vec3.new(0,0,0)
        this.d3 = Vec3.new(0,0,0)
        this.p  = Vec3.new(0,0,0)

        this.bbox = Bbox.fromMinMax( 
            Bbox.new(),
            Math.min(this.p1.x, this.p2.x, this.p3.x),
            Math.max(this.p1.x, this.p2.x, this.p3.x),
            Math.min(this.p1.y, this.p2.y, this.p3.y),
            Math.max(this.p1.y, this.p2.y, this.p3.y),
            Math.min(this.p1.z, this.p2.z, this.p3.z),
            Math.max(this.p1.z, this.p2.z, this.p3.z),
        )
    }

    static unSerialize(triangle){
        return new Triangle(triangle.p1, triangle.p2, triangle.p3)
    }

    getBbox(){
        return this.bbox
    }

    hit(ray){
        const denominator = Vec3.dot(this.normal, ray.direction)
        if(denominator == 0){
            return Infinity
        }

        const t = -(Vec3.dot(this.normal, ray.origin) + this.d) / denominator
        if(t < 0.001){
            return Infinity
        }

        Vec3.add(Vec3.mul(Vec3.equal(this.p, ray.direction), t), ray.origin)

        if( Vec3.dot( Vec3.sub(Vec3.equal(this.d1, this.p), this.p1), this.n12) > 0 ||
            Vec3.dot( Vec3.sub(Vec3.equal(this.d2, this.p), this.p2), this.n23) > 0 ||
            Vec3.dot( Vec3.sub(Vec3.equal(this.d3, this.p), this.p3), this.n31) > 0){
            return Infinity
        }
        return t
    }

    normalAt(position){
        let p2 = Vec3.clone(this.p2)
        let p3 = Vec3.clone(this.p3)
        Vec3.sub(p2, this.p1)
        Vec3.sub(p3, this.p1)
        Vec3.cross(p2, p3)
        return Vec3.normalize(p2)
    }
}

        /*let p1 = Vec3.clone(this.p1)
        let p2 = Vec3.clone(this.p2)
        let p3 = Vec3.clone(this.p3)
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

        return tScaled / det*/