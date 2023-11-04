import { Vec3, Ray, Color, Complex } from "./primitives.js"

export const BxDF = {
    PerfectDiffuse: 0,
    LambertianDiffuse: 1,
    Reflect: 2,
    Refract: 3,
    Dielectric: 4,
    Conductor: 5
}

export function deserialize(mat){
    switch(mat.type){
        case BxDF.PerfectDiffuse:
            return new PerfectDiffuse(mat.color)
        case BxDF.LambertianDiffuse:
            return new LambertianDiffuse(mat.color)
        case BxDF.Reflect:
            return new Reflect(mat.color, mat.granular_factor)
        case BxDF.Refract:
            return new Refract(mat.color, mat.eta_from, mat.eta_to)
        case BxDF.Dielectric:
            return new Dielectric(mat.color, mat.eta_from, mat.eta_to)
        case BxDF.Conductor:
            return new Conductor(mat.color, mat.eta_from, mat.eta_to)
        default:
            console.error(`Unknown material type : ${mat.type}`)
    }
}

export class PerfectDiffuse{
    constructor(color){
        this.type = BxDF.PerfectDiffuse
        this.color = color
    }
    apply(ray, obj){
        const normal = obj.normalAt(ray.origin)
        const sampled_dir = Vec3.random_spheric()
        ray.direction = Vec3.dot(normal, sampled_dir) < 0 ? sampled_dir : Vec3.mulScalar(sampled_dir, -1)
        return this.color
    }
}

export class LambertianDiffuse{
    constructor(color){
        this.type = BxDF.LambertianDiffuse
        this.color = color
    }
    apply(ray, obj){
        const normal = obj.normalAt(ray.origin)
        const sampled_dir = Vec3.random_spheric(ray.direction)
        ray.direction = Vec3.add(normal, Vec3.normalize(sampled_dir))
        return this.color
    }
}

export class Reflect{
    constructor(color, granular_factor=0.1){
        this.type = BxDF.Reflect
        this.color = color
        this.granular_factor = granular_factor
    }
    apply(ray, obj){
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
        return this.color
    }
}

export class Refract{
    constructor(color, eta_from=1, eta_to=1){
        this.type = BxDF.Refract
        this.color = color
        this.eta_from = eta_from
        this.eta_to = eta_to
    }
    apply(ray, obj){
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


        if(
            eta_ratio * Math.sqrt(1-cos_incident*cos_incident) > 1 || // Total internal reflection
            this.schlick_approx(cos_incident, this.eta_from, this.eta_to) > Math.random() // Schlick's approximation to the fresnel equations
        ){ 
            this.reflect(ray, normal, ray.direction)
        }else{
            const cos_transmitted = this.cos_theta_from_snell_law(eta_ratio, cos_incident)
            const incident_perpendicular = Vec3.add(ray.direction, Vec3.mulScalar( Vec3.clone(normal), cos_incident))
            const perpendicular = Vec3.mulScalar(incident_perpendicular, eta_ratio)
            const parallel = Vec3.mulScalar(normal, -cos_transmitted)
            ray.direction = Vec3.add(perpendicular, parallel)
        }
        return this.color
    }

    cos_theta_from_snell_law(eta_ratio, cos_incident){
        const squared = 1 - eta_ratio*eta_ratio*(1-cos_incident*cos_incident)
        return squared < 0 ? false : Math.sqrt(squared)
    }

    schlick_approx(cos, eta_from, eta_to) {
        let r0 = (eta_from-eta_to)/(eta_from+eta_to)
        r0 = r0*r0
        return r0 + (1-r0)*Math.pow(1-cos, 5)
    }

    reflect(ray, normal, direction){
        Vec3.sub(ray.direction, Vec3.mulScalar(normal, 2*Vec3.dot( direction, normal)))
    }

}

export class Dielectric{
    constructor(color, eta_from=1, eta_to=1){
        this.type = BxDF.Dielectric
        this.color = color
        this.eta_from = eta_from
        this.eta_to = eta_to
    }

    apply(ray, obj){
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
        return this.color
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

export class Conductor{
    constructor(color, eta_from, eta_to){
        this.type = BxDF.Conductor
        this.color = color
        this.eta_from = eta_from
        this.eta_to = eta_to
    }

    apply(ray, obj){
        Vec3.normalize(ray.direction)
        let eta_ratio
        let normal = obj.normalAt(ray.origin)
        let cos_incident = Vec3.dot(ray.direction, normal)

        if(cos_incident > 0){
            eta_ratio = Complex.div(Complex.clone(this.eta_to), this.eta_from)
            normal = Vec3.mulScalar(normal, -1)
        }else{
            eta_ratio = Complex.div(Complex.clone(this.eta_from), this.eta_to)
            cos_incident *= -1
        }

        const cos_transmitted = this.cos_theta_from_snell_law(eta_ratio, cos_incident)
        const r = this.fresnel_reflectance(eta_ratio, cos_incident, cos_transmitted)

        this.reflect(ray, normal, ray.direction)
        return Color.mul( Color.clone(this.color), r)
    }

    cos_theta_from_snell_law(eta_ratio, cos_incident){
        const tmp     = Complex.fromReal(1-cos_incident*cos_incident)
        const squared = Complex.sub(
            Complex.fromReal(1), 
            Complex.mul( Complex.mul( Complex.clone(eta_ratio), eta_ratio), tmp)
        )
        return Complex.sqrt(squared)
    }

    fresnel_reflectance(eta_ratio, cos_i, cos_t){
        const cos_i_c = Complex.fromReal(cos_i)

        const eta_cos_i = Complex.mul(Complex.clone(eta_ratio), cos_i_c)
        const r_parallel = Complex.div(
            Complex.sub( Complex.clone(eta_cos_i), cos_t), 
            Complex.add( Complex.clone(eta_cos_i), cos_t)
        )

        const eta_cos_t = Complex.mul(Complex.clone(eta_ratio), cos_t)
        const r_perpendicular = Complex.div(
            Complex.sub( Complex.clone(cos_i_c), eta_cos_t), 
            Complex.add( Complex.clone(cos_i_c), eta_cos_t)
        )
        
        return (Complex.modulusSquared(r_parallel) + Complex.modulusSquared(r_perpendicular))/2
    }

    reflect(ray, normal, direction){
        Vec3.sub(ray.direction, Vec3.mulScalar(normal, 2*Vec3.dot( direction, normal)))
    }
}