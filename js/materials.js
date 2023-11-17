import { Vec3, Color, Complex } from "./primitives.js"

export const BxDF = {
    Diffuse: 0,
    Reflect: 1,
    Transmit: 2,
    Dielectric: 3,
    Conductor: 4,
    RoughDielectric: 5
}

export function deserialize(mat){
    switch(mat.type){
        case BxDF.Diffuse:
            return new Diffuse(mat.color)
        case BxDF.Reflect:
            return new Reflect(mat.color, mat.granular_factor)
        case BxDF.Transmit:
            return new Transmit(mat.color, mat.etaFrom, mat.eta_To)
        case BxDF.Dielectric:
            return new Dielectric(mat.color, mat.etaFrom, mat.etaTo)
        case BxDF.Conductor:
            return new Conductor(mat.color, mat.etaFrom, mat.etaTo)
        default:
            console.error(`Unknown material type : ${mat.type}`)
    }
}

class Utils{
    static reflect(direction, normal){
        return Vec3.sub(Vec3.clone(direction), Vec3.mulScalar(normal, 2*Vec3.dot(direction, normal)))
    }

    static cosTransmittedFromSnellLaw(etaRatio, cosIncident){
        const squared = 1 - etaRatio*etaRatio*(1-cosIncident*cosIncident)
        return squared < 0 ? false : Math.sqrt(squared)
    }

    static adjustIfExitingRay(cosI, etaFrom, etaTo, normal){
        if(cosI > 0){
            Vec3.mulScalar(normal, -1)
            return {
                etaRatio: etaTo/etaFrom,
                cosI:     cosI
            }
        }else{
            return {
                etaRatio: etaFrom/etaTo,
                cosI:     -cosI
            }
        }
    }
}

export class Diffuse{
    constructor(color){
        this.type  = BxDF.Diffuse
        this.color = color
    }

    sample(ray, normal){
        return {
            weight     : this.color,
            throughput : this.color,
            direction  : Vec3.add(normal, Vec3.randomOnUnitSphere(ray.getDirection()))
        }
    }
}

export class Reflect{
    constructor(color, granularity=0.1){
        this.type        = BxDF.Reflect
        this.color       = color
        this.granularity = granularity
    }

    sample(ray, normal){
        let reflectDir = Vec3.mulScalar(normal, 2*Vec3.dot(ray.getDirection(), normal) )
        if(this.granularity > 0){
            let reflectJiggle = Vec3.mulScalar( Vec3.randomOnUnitSphere(Vec3.new()), this.granularity) 
            Vec3.add(reflectDir, reflectJiggle )
        }
        
        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : Vec3.sub(ray.getDirection(), reflectDir)
        }
    }
}

export class Transmit{
    constructor(color, etaFrom=1, etaTo=1){
        this.type    = BxDF.Transmit
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    sample(ray, normal){
        let etaRatio
        let cosI = Vec3.dot(ray.getDirection(), normal);
        ({etaRatio, cosI} = Utils.adjustIfExitingRay(cosI, this.etaFrom, this.etaTo, normal))

        let resultDir
        if(
            etaRatio * Math.sqrt(1-cosI*cosI) > 1 || // Total internal reflection
            this.schlickApproximation(cosI, this.etaFrom, this.etaTo) > Math.random() // Schlick's approximation to the fresnel equations
        ){ 
            resultDir = Utils.reflect(ray.getDirection(), normal)
        }else{
            const cos_transmitted = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
            const incidentPerpendicular = Vec3.add(ray.getDirection(), Vec3.mulScalar( Vec3.clone(normal), cosI))
            const perpendicular = Vec3.mulScalar(incidentPerpendicular, etaRatio)
            const parallel = Vec3.mulScalar(normal, -cos_transmitted)
            resultDir = Vec3.add(perpendicular, parallel)
        }

        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
        }
    }

    schlickApproximation(cos, etaFrom, etaTo) {
        let r0 = (etaFrom-etaTo)/(etaFrom+etaTo)
        r0 = r0*r0
        return r0 + (1-r0)*Math.pow(1-cos, 5)
    }

}

export class Dielectric{
    constructor(color, etaFrom=1, etaTo=1){
        this.type    = BxDF.Dielectric
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    sample(ray, normal){
        let etaRatio
        let cosI = Vec3.dot(ray.getDirection(), normal);
        ({etaRatio, cosI} = Utils.adjustIfExitingRay(cosI, this.etaFrom, this.etaTo, normal))

        const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
        
        let resultDir
        if(cosT === false){ // Total internal reflection
            resultDir = Utils.reflect(ray.getDirection(), normal)
        }else{
            const reflectance = this.fresnelReflectance(etaRatio, cosI, cosT)
            if(reflectance > Math.random()){
                resultDir = Utils.reflect(ray.getDirection(), normal)
            }else{ // Transmit
                const incidentPerpendicular = Vec3.add(ray.getDirection(), Vec3.mulScalar( Vec3.clone(normal), cosI))
                const perpendicular = Vec3.mulScalar(incidentPerpendicular, etaRatio)
                const parallel = Vec3.mulScalar(normal, -cosT)
                resultDir = Vec3.add(perpendicular, parallel)
            }
        }

        return {
            // Weight is always 1, as the reflectance compensates with the PDF
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
        }
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}

export class Conductor{
    constructor(color, etaFrom, etaTo){
        this.type    = BxDF.Conductor
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    sample(ray, normal){
        let etaRatio
        let cosI = Vec3.dot(ray.getDirection(), normal)

        if(cosI > 0){
            etaRatio = Complex.div(Complex.clone(this.etaTo), this.etaFrom)
            normal = Vec3.mulScalar(normal, -1)
        }else{
            etaRatio = Complex.div(Complex.clone(this.etaFrom), this.etaTo)
            cosI *= -1
        }

        const cosT = this.cosThetaSnellLawComplex(etaRatio, cosI)
        const reflectance = this.fresnelReflectanceComplex(etaRatio, Complex.fromReal(cosI), cosT)

        return {
            weight     : Color.mulScalar( Color.clone(this.color), reflectance),
            throughput : Color.clone(this.color),
            direction  : Utils.reflect(ray.getDirection(), normal)
        }
    }

    cosThetaSnellLawComplex(etaRatio, cosI){
        const tmp     = Complex.fromReal(1-cosI*cosI)
        const squared = Complex.sub(
            Complex.fromReal(1), 
            Complex.mul( Complex.mul( Complex.clone(etaRatio), etaRatio), tmp)
        )
        return Complex.sqrt(squared)
    }

    fresnelReflectanceComplex(etaRatio, cosI, cosT){
        const etaCosT = Complex.mul(Complex.clone(etaRatio), cosT)
        const etaCosI = Complex.mul(Complex.clone(etaRatio), cosI)

        const r_parallel = Complex.div(
            Complex.sub( Complex.clone(cosI), etaCosT), 
            Complex.add( Complex.clone(cosI), etaCosT)
        )

        const r_perpendicular = Complex.div(
            Complex.sub( Complex.clone(cosT), etaCosI), 
            Complex.add( Complex.clone(cosT), etaCosI)
        )
        
        return (Complex.modulusSquared(r_parallel) + Complex.modulusSquared(r_perpendicular))/2
    }
}

// Uses the Torrance-Sparrow BSDF based on the Trowbridge-Reitz microfacet model
export class RoughDielectric{
    constructor(color, etaFrom=1, etaTo=1, roughness=0){
        this.type      = BxDF.RoughDielectric
        this.color     = color
        this.etaFrom   = etaFrom
        this.etaTo     = etaTo  
        this.roughness = roughness
    }

    sample(ray, normal){

        let cosI = Vec3.dot(ray.getDirection(), normal);
        ({etaRatio, cosI} = Utils.adjustIfExitingRay(cosI, this.etaFrom, this.etaTo, normal))

        const alphaX = 2
        const alphaY = 2

        ray.direction *= alphaX
        ray.direction *= alphaY
        Vec3.normalize(ray.direction)

        let p = Vec3.new()
        Vec3.random(p)
        while(p.x*p.x + p.y*p.y >= 1){
            Vec3.random(p)
        }
        p.y = p.y*(1+cosI)/2 + math.sqrt(1-p.x*p.x)*(1-cosI)/2

        const T1 = Vec3.normalize(Vec3.cross(Vec3.new(0,0,1), ray.direction))
        const T2 = Vec3.cross(T1, ray.direction)

        let x = Vec3.mulScalar(Vec3.new(1,0,0), p.x * alphaX)
        let y = Vec3.mul(T2, p.y) * alphaY
        let z = Vec3.mulScalar(ray.direction, math.sqrt(1-(p.x*p.x+p.y*p.y)) )

        let finalDirection = Vec3.add(Vec3.add(x,y),z)





        /*return {
            weight     : ,
            throughput : ,
            direction  : 
        }*/
    }
}