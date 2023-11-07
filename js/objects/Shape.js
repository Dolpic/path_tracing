import { Vec3 } from "../primitives.js"
import { Bbox } from "./structures/Bbox.js"
import { Sbox } from "./structures/Sbox.js"

const T_MIN = 0.0001

export const Shapes = {
    Sphere:0,
    Triangle:1
}

export function deserialize(shp, mat){
    switch(shp.type){
        case Shapes.Sphere:
            return Sphere.deserialize(shp, mat)
        case Shapes.Triangle:
            return Triangle.deserialize(shp, mat)
        default:
            console.error(`Unknown shape type : ${shp.type}`)
    }
}

export class Sphere{
    constructor(center, radius, material){
        this.type = Shapes.Sphere
        this.center = center
        this.radius = radius
        this.material = material
        this.bbox = Bbox.new( 
            Vec3.subScalar(Vec3.clone(center), this.radius), 
            Vec3.addScalar(Vec3.clone(center), this.radius)
        )
        this.sbox = Sbox.new(this.center, this.radius)
    }

    static deserialize(sphere, materials){
        return new Sphere(sphere.center, sphere.radius, materials[sphere.material])
    }

    getBbox(){
        return this.bbox
    }

    getSbox(){
        return this.sbox
    }

    hit(ray){
        const diff = Vec3.sub( Vec3.clone(ray.origin), this.center)
        const a = Vec3.dot(ray.direction, ray.direction)
        const b = 2*Vec3.dot(ray.direction, diff)
        const c = Vec3.dot(diff, diff) - this.radius*this.radius
        const discriminant = b*b - 4*a*c
        if(discriminant >= 0){
            let t = (-b-Math.sqrt(discriminant))/(2*a)
            if(t > T_MIN){
                return t
            }else{
                t = (-b+Math.sqrt(discriminant))/(2*a)
                return t > T_MIN ? t : Infinity
            }
        }else{
            return Infinity
        }
    }

    normalAt(position){
        return Vec3.normalize(Vec3.sub(Vec3.clone(position), this.center))
    }
}

export class Triangle{
    // TODO error if two vertices are the same
    constructor(p1, p2, p3, material, p1_normal=null, p2_normal=null, p3_normal=null){
        this.type = Shapes.Triangle
        this.p1 = p1
        this.p2 = p2
        this.p3 = p3
        this.material = material

        this.n12 = Vec3.sub( Vec3.clone(this.p2), this.p1)
        this.n23 = Vec3.sub( Vec3.clone(this.p3), this.p2)
        this.n31 = Vec3.sub( Vec3.clone(this.p1), this.p3)
        this.normal = Vec3.normalize(Vec3.cross( Vec3.clone(this.n12), this.n23))

        Vec3.cross(this.n12, this.normal)
        Vec3.cross(this.n23, this.normal)
        Vec3.cross(this.n31, this.normal)
        this.d = - (this.normal.x*this.p1.x + this.normal.y*this.p1.y + this.normal.z*this.p1.z)

        this.bbox = Bbox.fromMinMax( 
            Bbox.new(),
            Math.min(this.p1.x, this.p2.x, this.p3.x),
            Math.max(this.p1.x, this.p2.x, this.p3.x),
            Math.min(this.p1.y, this.p2.y, this.p3.y),
            Math.max(this.p1.y, this.p2.y, this.p3.y),
            Math.min(this.p1.z, this.p2.z, this.p3.z),
            Math.max(this.p1.z, this.p2.z, this.p3.z),
        )

        const center = Vec3.new( (p1.x+p2.x+p3.x)/3, (p1.y+p2.y+p3.y)/3, (p1.z+p2.z+p3.z)/3 )
        let distP1 = Vec3.norm_squared(Vec3.sub(Vec3.clone(center), p1))
        let distP2 = Vec3.norm_squared(Vec3.sub(Vec3.clone(center), p2))
        let distP3 = Vec3.norm_squared(Vec3.sub(Vec3.clone(center), p3))
        let radius = Math.sqrt(Math.max(distP1, distP2, distP3))
        this.sbox = Sbox.new(center, radius)

        if(p1_normal != null && p2_normal != null && p3_normal != null){
            this.interpolated_normals = true
            this.p1_normal = Vec3.normalize(p1_normal)
            this.p2_normal = Vec3.normalize(p2_normal)
            this.p3_normal = Vec3.normalize(p3_normal)
            this.projection_axis = 'Z'
            this.interpolate_denominator = (this.p2.y-this.p3.y)*(this.p1.x-this.p3.x) + (this.p3.x-this.p2.x)*(this.p1.y-this.p3.y)
            if(this.interpolate_denominator == 0){ // If the triangle can't be projection on Z
                this.projection_axis = 'Y'
                this.interpolate_denominator = (this.p2.z-this.p3.z)*(this.p1.x-this.p3.x) + (this.p3.x-this.p2.x)*(this.p1.z-this.p3.z)
            }
        }else{
            this.interpolated_normals = false
            this.p1_normal = null
            this.p2_normal = null
            this.p3_normal = null

        }
    }

    static deserialize(triangle, materials){
        return new Triangle(
            triangle.p1, 
            triangle.p2, 
            triangle.p3, 
            materials[triangle.material],
            triangle.p1_normal,
            triangle.p2_normal,
            triangle.p3_normal)
    }

    getBbox(){
        return this.bbox
    }

    getSbox(){
        return this.sbox
    }

    hit(ray){
        const denominator = Vec3.dot(this.normal, ray.direction)
        if(denominator == 0){
            return Infinity
        }
        const t = -(Vec3.dot(this.normal, ray.origin) + this.d) / denominator
        if(t < T_MIN){
            return Infinity
        }

        const p = Vec3.add(Vec3.mulScalar(Vec3.clone(ray.direction), t), ray.origin)

        if( Vec3.dot( Vec3.sub(Vec3.clone(p), this.p1), this.n12) > 0 ||
            Vec3.dot( Vec3.sub(Vec3.clone(p), this.p2), this.n23) > 0 ||
            Vec3.dot( Vec3.sub(Vec3.clone(p), this.p3), this.n31) > 0){
            return Infinity
        }
        return t
    }

    normalAt(position){
        if(this.interpolated_normals){
            // https://en.wikipedia.org/wiki/Barycentric_coordinate_system
            let w_1
            let w_2
            if(this.projection_axis == 'Z'){
                w_1 = ((this.p2.y-this.p3.y)*(position.x-this.p3.x)+(this.p3.x-this.p2.x)*(position.y-this.p3.y))/this.interpolate_denominator
                w_2 = ((this.p3.y-this.p1.y)*(position.x-this.p3.x)+(this.p1.x-this.p3.x)*(position.y-this.p3.y))/this.interpolate_denominator
            }else{
                w_1 = ((this.p2.z-this.p3.z)*(position.x-this.p3.x)+(this.p3.x-this.p2.x)*(position.z-this.p3.z))/this.interpolate_denominator
                w_2 = ((this.p3.z-this.p1.z)*(position.x-this.p3.x)+(this.p1.x-this.p3.x)*(position.z-this.p3.z))/this.interpolate_denominator
            }
            const w_3 = 1 - w_1 - w_2

            const result = Vec3.new(
                this.p1_normal.x*w_1 + this.p2_normal.x*w_2 + this.p3_normal.x*w_3,
                this.p1_normal.y*w_1 + this.p2_normal.y*w_2 + this.p3_normal.y*w_3,
                this.p1_normal.z*w_1 + this.p2_normal.z*w_2 + this.p3_normal.z*w_3,
            )
            return Vec3.normalize(result)
        }else{
            return Vec3.clone(this.normal)
        }
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
