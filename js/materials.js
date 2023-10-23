import { Vec3, Ray, Color } from "./primitives.js"

export function unSerialize(material){
    let new_bxdf
    switch(material.BxDF.name){
        case "perfectDiffuse":
            new_bxdf = new PerfectDiffuse()
            break
        case "lambertianDiffuse":
            new_bxdf = new LambertianDiffuse()
            break
        case "granular_mirror":
            new_bxdf = new Granular_mirror(material.BxDF.granular_factor)
            break
        case "refract":
            new_bxdf = new Refract()
            break
        case "composite":
            new_bxdf = new Composite()
            break
        default:
            console.error(`Unknown material : ${material}`)
    }
    return new Material(new_bxdf, material.color, material.multiplier)
}


export class Material{
    constructor(BxDF, color, multiplier){
        this.BxDF = BxDF
        this.color = color
        this.multiplier = multiplier

        this.color_mul = Color.mul(color, multiplier)
    }

    updateRay(ray, t, obj){
        this.BxDF.apply(ray, t, obj)
        Color.mul(ray.color, this.color_mul)
    }
}

export class PerfectDiffuse{
    constructor(){this.name="perfectDiffuse"}
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        let new_dir = Vec3.random_spheric()
        let normal = obj.normalAt(ray.origin)
        ray.direction = Vec3.dot(normal, new_dir) < 0 ? new_dir : Vec3.mulScalar(new_dir, -1)
    }
}

export class LambertianDiffuse{
    constructor(){this.name="lambertianDiffuse"}
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        let normal = obj.normalAt(ray.origin)
        ray.direction = Vec3.add(normal, Vec3.normalize( Vec3.random_spheric(ray.direction) ))
    }
}

export class Granular_mirror{
    constructor(granular_factor=0.1){
        this.name="granular_mirror"
        this.granular_factor = granular_factor
    }
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        let normal = obj.normalAt(ray.origin)
        let dot = Vec3.dot(ray.direction, normal)

        // TODO necessary ?
        if(dot > 0){
            Vec3.mulScalar(normal, -1)
        }
        dot = Vec3.dot(ray.direction, normal)


        if(this.granular_factor > 0){
            /*let reflectJiggle = Vec3.mulScalar( Vec3.normalize(Vec3.random_spheric(ray.direction)), this.granular_factor) 
            let reflectDir = Vec3.mulScalar(normal, 2*dot )
            Vec3.sub(ray.direction, Vec3.add(reflectDir, reflectJiggle ))*/
        }else{
            let reflectDir = Vec3.mulScalar(normal, 2*dot )
            Vec3.sub(ray.direction, reflectDir)
        }
    }
}

export class Refract{
    constructor(eta_from=1, eta_to=1){
        this.name="refract"
        this.eta_from = eta_from
        this.eta_to = eta_to
    }
    apply(ray, t, obj){
        let normal = obj.normalAt(ray.origin) // Wrong !
        let dot = Vec3.dot(ray.direction, normal)
        let eta_ratio = this.eta_from/this.eta_to
    
        if(eta_ratio * Math.sqrt(1-dot*dot) > 1){
            mirror(ray, t, obj)
        }else{
            Ray.moveAt(ray, t)
            let toAdd = Vec3.dot(Vec3.mulScalar( Vec3.clone(ray.direction), -1), normal)
            let perpendicular =  Vec3.add(ray.direction, toAdd)
            Vec3.mul(perpendicular, eta_ratio)
            let parallel = Vec3.mulScalar(normal, -Math.sqrt(1-perpendicular.norm_squared()))
            ray.direction = Vec3.add(perpendicular, parallel)
        }
    }
}

export class Composite{
    constructor(material1, material2, probability_1){
        this.name="composite"
        this.material1 = material1
        this.material2 = material2
        this.probability_1 = probability_1
    }
    apply(ray, t, obj){
        Math.random() < this.threshold ? this.material1.apply(ray, t, obj) : this.material2.apply(ray, t, obj)
    }
}
