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
        case "reflect":
            new_bxdf = new Reflect(material.BxDF.granular_factor)
            break
        case "refract":
            new_bxdf = new Refract(material.BxDF.eta_from, material.BxDF.eta_to)
            break
        case "composite":
            new_bxdf = new Composite()
            break
        default:
            console.error(`Unknown material : ${material}`)
    }
    return new Material(new_bxdf, material.color)
}


export class Material{
    constructor(BxDF, color){
        this.BxDF = BxDF
        this.color = color
    }

    updateRay(ray, t, obj){
        this.BxDF.apply(ray, t, obj)
        Color.mul(ray.color, this.color)
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

export class Reflect{
    constructor(granular_factor=0.1){
        this.name="reflect"
        this.granular_factor = granular_factor
    }
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        let normal = obj.normalAt(ray.origin)
        let reflectDir = Vec3.mulScalar(normal, 2*Vec3.dot(ray.direction, normal) )

        // TODO necessary ?
       /* if(dot > 0){
            Vec3.mulScalar(normal, -1)
        }
        dot = Vec3.dot(ray.direction, normal)*/

        if(this.granular_factor > 0){
            let reflectJiggle = Vec3.mulScalar( Vec3.normalize(Vec3.random_spheric(Vec3.new())), this.granular_factor) 
            Vec3.sub(ray.direction, Vec3.add(reflectDir, reflectJiggle ))
        }else{
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
        Ray.moveAt(ray, t)
        const normal = obj.normalAt(ray.origin)
        const dir_normalized = Vec3.normalize(Vec3.clone(ray.direction))
        const cos_theta = Vec3.dot( Vec3.mulScalar( Vec3.clone(dir_normalized), -1), normal)
        const eta_ratio = this.eta_from/this.eta_to

        if(
            eta_ratio * Math.sqrt(1-cos_theta*cos_theta) > 1 || // Total internal reflection
            this.schlick_approx(cos_theta, this.eta_from, this.eta_to) > Math.random() // Schlick's approximation to the fresnel equations
        ){ 
            const reflectDir = Vec3.mulScalar(normal, 2*Vec3.dot(dir_normalized, normal) )
            Vec3.sub(ray.direction, reflectDir)
        }else{
            const cos_theta_n = Vec3.mulScalar( Vec3.clone(normal), cos_theta)
            let perpendicular = Vec3.mulScalar(Vec3.add(dir_normalized, cos_theta_n), eta_ratio)
            let parallel = Vec3.mulScalar(normal, -Math.sqrt( 1-Vec3.norm_squared(perpendicular)  ))
            ray.direction = Vec3.add(perpendicular, parallel)
        }
    }

    schlick_approx(cos, eta_from, eta_to) {
        let r0 = (eta_from-eta_to)/(eta_from+eta_to)
        r0 = r0*r0
        return r0 + (1-r0)*Math.pow(1-cos, 5)
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
