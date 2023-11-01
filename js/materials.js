import { Vec3, Ray, Color } from "./primitives.js"

export const BxDF = {
    PerfectDiffuse: 0,
    LambertianDiffuse: 1,
    Reflect: 2,
    Refract: 3,
    Dielectric: 4
}

export function deserialize(material){
    let new_bxdf
    switch(material.BxDF.type){
        case BxDF.PerfectDiffuse:
            new_bxdf = new PerfectDiffuse()
            break
        case BxDF.LambertianDiffuse:
            new_bxdf = new LambertianDiffuse()
            break
        case BxDF.Reflect:
            new_bxdf = new Reflect(material.BxDF.granular_factor)
            break
        case BxDF.Refract:
            new_bxdf = new Refract(material.BxDF.eta_from, material.BxDF.eta_to)
            break
        case BxDF.Dielectric:
            new_bxdf = new Dielectric(material.BxDF.eta_from, material.BxDF.eta_to)
            break
        default:
            console.error(`Unknown material type : ${material.BxDF.type}`)
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
    constructor(){
        this.type = BxDF.PerfectDiffuse
    }
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        let new_dir = Vec3.random_spheric()
        let normal = obj.normalAt(ray.origin)
        ray.direction = Vec3.dot(normal, new_dir) < 0 ? new_dir : Vec3.mulScalar(new_dir, -1)
    }
}

export class LambertianDiffuse{
    constructor(){
        this.type = BxDF.LambertianDiffuse
    }
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        let normal = obj.normalAt(ray.origin)
        ray.direction = Vec3.add(normal, Vec3.normalize( Vec3.random_spheric(ray.direction) ))
    }
}

export class Reflect{
    constructor(granular_factor=0.1){
        this.type = BxDF.Reflect
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
        this.type = BxDF.Refract
        this.eta_from = eta_from
        this.eta_to = eta_to
    }
    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        const normal = obj.normalAt(ray.origin)
        const isFromOutside = Vec3.dot(normal, ray.direction) < 0
        const eta_ratio = isFromOutside ? this.eta_from/this.eta_to : this.eta_to/this.eta_from
        const dir_normalized = Vec3.normalize(Vec3.clone(ray.direction))
        const cos_theta = Vec3.dot( Vec3.mulScalar( Vec3.clone(dir_normalized), -1), normal)

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

export class Dielectric{
    constructor(eta_from=1, eta_to=1){
        this.type = BxDF.Dielectric
        this.eta_from = eta_from
        this.eta_to = eta_to
    }

    apply(ray, t, obj){
        Ray.moveAt(ray, t)
        Vec3.normalize(ray.direction)
        let eta_ratio
        let normal = obj.normalAt(ray.origin)
        let cos_incident = Vec3.dot(ray.direction, normal)

        if(cos_incident > 0){
            eta_ratio = this.eta_to/this.eta_from
            normal = Vec3.mulScalar(normal, -1)
        }else{
            eta_ratio = this.eta_from/this.eta_to
            cos_incident *= -1
        }

        const cos_transmitted = this.cos_theta_from_snell_law(eta_ratio, cos_incident)

        if(cos_transmitted === false){ // Total internal reflection
            this.reflect(ray, normal, ray.direction)
        }else{
            const r = this.fresnel_reflectance(eta_ratio, cos_incident, cos_transmitted)
            if(r > Math.random()){
                this.reflect(ray, normal, ray.direction)
            }else{ // Transmit
                const incident_perpendicular = Vec3.add(ray.direction, Vec3.mulScalar( Vec3.clone(normal), cos_incident))
                const perpendicular = Vec3.mulScalar(incident_perpendicular, eta_ratio)
                const parallel = Vec3.mulScalar(normal, -cos_transmitted)
                ray.direction = Vec3.add(perpendicular, parallel)
            }
        }
    }

    cos_theta_from_snell_law(eta_ratio, cos_incident){
        const squared = 1 - eta_ratio*eta_ratio*(1-cos_incident*cos_incident)
        return squared < 0 ? false : Math.sqrt(squared)
    }

    fresnel_reflectance(eta_ratio, cos_i, cos_t){
        const r_parallel      = (eta_ratio*cos_i-cos_t) / (eta_ratio*cos_i+cos_t)
        const r_perpendicular = (cos_i-eta_ratio*cos_t) / (cos_i+eta_ratio*cos_t)
        return (r_parallel*r_parallel + r_perpendicular*r_perpendicular)/2
    }

    reflect(ray, normal, direction){
        Vec3.sub(ray.direction, Vec3.mulScalar(normal, 2*Vec3.dot( direction, normal)))
    }
}