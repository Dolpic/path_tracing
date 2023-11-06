import { Vec3, Ray, Color, Complex } from "./primitives.js"

export const BxDF = {
    Diffuse: 0,
    Reflect: 1,
    Refract: 2,
    Dielectric: 3,
    Conductor: 4
}

export function deserialize(mat){
    switch(mat.type){
        case BxDF.Diffuse:
            return new Diffuse(mat.color)
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

export class Diffuse{
    constructor(color){
        this.type = BxDF.Diffuse
        this.color = color
    }

    sample(ray, normal){
        const sampledDir = Vec3.normalize(Vec3.random_spheric(ray.direction))
        return {
            weight     : this.color,
            throughput : this.color,
            direction  : Vec3.add(normal, sampledDir)
        }
    }
}

export class Reflect{
    constructor(color, granularFactor=0.1){
        this.type = BxDF.Reflect
        this.color = color
        this.granularFactor = granularFactor
    }

    sample(ray, normal){
        let reflectDir = Vec3.mulScalar(normal, 2*Vec3.dot(ray.direction, normal) )
        let resultDir
        if(this.granularFactor > 0){
            let reflectJiggle = Vec3.mulScalar( Vec3.normalize(Vec3.random_spheric(Vec3.new())), this.granular_factor) 
            resultDir = Vec3.sub(Vec3.clone(ray.direction), Vec3.add(reflectDir, reflectJiggle ))
        }else{
            resultDir = Vec3.sub(Vec3.clone(ray.direction), reflectDir)
        }

        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
        }
    }
}

export class Refract{
    constructor(color, eta_from=1, eta_to=1){
        this.type = BxDF.Refract
        this.color = color
        this.eta_from = eta_from
        this.eta_to = eta_to
    }

    sample(ray, normal){
        let eta_ratio
        let cos_incident = Vec3.dot(ray.direction, normal)

        if(cos_incident > 0){
            eta_ratio = this.eta_to/this.eta_from
            normal = Vec3.mulScalar(normal, -1)
        }else{
            eta_ratio = this.eta_from/this.eta_to
            cos_incident *= -1
        }

        let resultDir
        if(
            eta_ratio * Math.sqrt(1-cos_incident*cos_incident) > 1 || // Total internal reflection
            this.schlick_approx(cos_incident, this.eta_from, this.eta_to) > Math.random() // Schlick's approximation to the fresnel equations
        ){ 
            resultDir = this.reflect(ray, normal, ray.direction)
        }else{
            const cos_transmitted = this.cos_theta_from_snell_law(eta_ratio, cos_incident)
            const incident_perpendicular = Vec3.add(ray.direction, Vec3.mulScalar( Vec3.clone(normal), cos_incident))
            const perpendicular = Vec3.mulScalar(incident_perpendicular, eta_ratio)
            const parallel = Vec3.mulScalar(normal, -cos_transmitted)
            resultDir = Vec3.add(perpendicular, parallel)
        }

        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
        }
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
        return Vec3.sub(Vec3.clone(ray.direction), Vec3.mulScalar(normal, 2*Vec3.dot( direction, normal)))
    }

}

export class Dielectric{
    constructor(color, eta_from=1, eta_to=1){
        this.type = BxDF.Dielectric
        this.color = color
        this.eta_from = eta_from
        this.eta_to = eta_to
    }

    sample(ray, normal){
        let eta_ratio
        let cos_incident = Vec3.dot(ray.direction, normal)

        if(cos_incident > 0){
            eta_ratio = this.eta_to/this.eta_from
            normal = Vec3.mulScalar(normal, -1)
        }else{
            eta_ratio = this.eta_from/this.eta_to
            cos_incident *= -1
        }

        const cos_transmitted = this.cos_theta_from_snell_law(eta_ratio, cos_incident)
        let resultDir

        if(cos_transmitted === false){ // Total internal reflection
            resultDir = this.reflect(ray, normal, ray.direction)
        }else{
            const r = this.fresnel_reflectance(eta_ratio, cos_incident, cos_transmitted)
            if(r > Math.random()){
                resultDir = this.reflect(ray, normal, ray.direction)
            }else{ // Transmit
                const incident_perpendicular = Vec3.add(ray.direction, Vec3.mulScalar( Vec3.clone(normal), cos_incident))
                const perpendicular = Vec3.mulScalar(incident_perpendicular, eta_ratio)
                const parallel = Vec3.mulScalar(normal, -cos_transmitted)
                resultDir = Vec3.add(perpendicular, parallel)
            }
        }

        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
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
        return Vec3.sub(Vec3.clone(ray.direction), Vec3.mulScalar(normal, 2*Vec3.dot( direction, normal)))
    }
}

export class Conductor{
    constructor(color, eta_from, eta_to){
        this.type = BxDF.Conductor
        this.color = color
        this.eta_from = eta_from
        this.eta_to = eta_to
    }

    sample(ray, normal){
        let eta_ratio
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

        const resDir = this.reflect(ray, normal, ray.direction)
        const resColor = Color.mulScalar( Color.clone(this.color), r)
        return {
            weight     : resColor,
            throughput : resColor,
            direction  : resDir
        }
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
        return Vec3.sub(Vec3.clone(ray.direction), Vec3.mulScalar(normal, 2*Vec3.dot( direction, normal)))
    }
}