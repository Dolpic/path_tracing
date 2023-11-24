import { Vec3, Color, Complex } from "./primitives.js"

export const BxDF = {
    Diffuse: 0,
    Reflect: 1,
    Transmit: 2,
    Dielectric: 3,
    Conductor: 4,
    RoughConductor: 5
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
            return new Conductor(mat.color, mat.etaFrom, mat.etaTo, mat.roughnessX, mat.roughnessY)
        case BxDF.RoughConductor:
            return new RoughConductor(mat.color, mat.etaFrom, mat.etaTo, mat.roughness)
        default:
            console.error(`Unknown material type : ${mat.type}`)
    }
}

class Utils{
    static reflect(direction, normal){
        return Vec3.sub(Vec3.clone(direction), Vec3.mulScalar(Vec3.clone(normal), 2*Vec3.dot(direction, normal)))
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

    static toLocal(v, normal){
        const {x:xAxis, y:yAxis} = this.getGlobalXYAxis(normal)
        const x = Vec3.dot(v, xAxis)
        const y = Vec3.dot(v, yAxis)
        const z = Vec3.dot(v, normal)
        return Vec3.normalize(Vec3.set(v, x,y,z))
    }

    static toGlobal(v, normal){
        const {x:xAxis, y:yAxis} = this.getGlobalXYAxis(normal)
        const x = Vec3.mulScalar(xAxis, v.x)
        const y = Vec3.mulScalar(yAxis, v.y)
        const z = Vec3.mulScalar(Vec3.clone(normal), v.z)
        return Vec3.equal(v, Vec3.add(Vec3.add(x,y), z))
    }

    static getGlobalXYAxis(normal){
        if(normal.x == 0 && normal.y == 0){
            return {x:Vec3.clone(Vec3.X), y:Vec3.clone(Vec3.Y)}
        }else{
            const xaxis = Vec3.normalize(Vec3.new(-normal.y, normal.x, 0))
            return {
                x: xaxis,
                y: Vec3.normalize(Vec3.cross(Vec3.clone(xaxis), normal))
            }
        }
    }

    /* Assumes local coordinates */
    static sameHemisphere(vec1, vec2){
        return vec1.z * vec2.z > 0
    }
}

export class Material{
    constructor(){}
    hit(dirIn, normal){
        const result = this.hitLocal(Utils.toLocal(dirIn, normal))
        return {
            color: result.color,
            direction: Utils.toGlobal(result.direction, normal)
        }
    }
    sample(dirIn, dirOut, normal){
        Utils.toLocal(dirIn, normal)
        Utils.toLocal(dirOut, normal)
        return this.sampleLocal(dirIn, dirOut)
    }
}

export class Diffuse extends Material{
    constructor(color){
        super()
        this.type  = BxDF.Diffuse
        this.color = color
    }

    hitLocal(dirIn){
        //const dirOut = Vec3.randomOnHemisphere(Vec3.new())
        const dirOut = Vec3.randomOnHemisphereCosWeighted(Vec3.new())
        if(Utils.sameHemisphere(dirOut, dirIn)){
            dirOut.z *= -1
        }

        const PDF = Math.abs(dirOut.z) * (1/Math.PI)
        return {
            color    : Color.mulScalar(this.sampleLocal(dirIn, dirOut), 1/PDF),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut){
        if(Utils.sameHemisphere(dirIn, dirOut)){
            return Color.ZERO
        }
        return Color.mulScalar(Color.clone(this.color), 1/Math.PI)
    }

}

export class Reflect{
    constructor(color, granularity=0){
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
    constructor(color, etaFrom, etaTo, roughnessX=0, roughnessY=0){
        this.type    = BxDF.Conductor
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
        this.roughnessX = roughnessX
        this.roughnessY = roughnessY
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

        let weight       = Color.clone(this.color)
        let throughput   = Color.clone(this.color)
        let directionOut = Utils.reflect(ray.getDirection(), normal)

        this.roughnessX = 1
        this.roughnessY = 1
        if(this.roughnessX != 0 || this.roughnessY != 0){
            const inverseDir = Vec3.mulScalar(Vec3.clone(ray.direction), -1)
            const normalMicro  = this.microfacetNormal(inverseDir, normal)

            // Note : This value can be on the opposite hemisphere as the macroface normal
            directionOut = Utils.reflect(ray.direction, normalMicro)
            if(Vec3.dot(inverseDir, normal) * Vec3.dot(directionOut, normal) < 0){
                return false
            }

            if(Vec3.dot(normalMicro, normal) < 0){
                console.error("Normals not on the same hemisphere")
            }

            const cosI_m = this.absDot(inverseDir, normalMicro)
            const cosIOut = Vec3.normalize(this.toLocal(directionOut, normal)).z

            const G = this.MaskingShadowing(inverseDir, directionOut, normal)
            const D = this.TrowbridgeReitz(normalMicro, normal)
            const f = D*G/(4*cosI*cosIOut)
            const PDF = (this.Masking(inverseDir, normal)/cosI *D*this.absDot(inverseDir, normalMicro)) / (4*this.absDot(inverseDir, normalMicro))

            const cosT = this.cosThetaSnellLawComplex(etaRatio, cosI_m)
            const reflectance = this.fresnelReflectanceComplex(etaRatio, Complex.fromReal(cosI_m), cosT)

            Color.mulScalar(weight, (f/PDF)*this.absDot(directionOut, normal)) // PDF too small
            Color.mulScalar(throughput, f)
        }

        return {
            weight     : weight, //this.color,
            throughput : throughput, //Color.ZERO,
            direction  : directionOut
        }
    }

    absDot(v1, v2){
        const res = Vec3.dot(v1,v2)
        if(res < 0){
            console.error("absDot error")
        }
        return res
    }


    cosPhi(direction, normal){
        const xAxis = this.xAxis(normal)
        const dirLocal = this.toLocal(direction, normal)
        const dirLocalFlat = Vec3.normalize(Vec3.new(dirLocal.x, dirLocal.y, 0))
        return Vec3.dot(xAxis, dirLocalFlat)
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

    toLocal(v, normal){
        const xAxis = this.xAxis(normal)
        const yAxis = Vec3.normalize(Vec3.cross(Vec3.clone(xAxis), normal))
        return Vec3.normalize(Vec3.new(Vec3.dot(v, xAxis), Vec3.dot(v, yAxis), Vec3.dot(v, normal))) 
    }

    toGlobal(v, normal){
        const xAxis = this.xAxis(normal)
        const yAxis = Vec3.normalize(Vec3.cross(Vec3.clone(xAxis), normal))
        return Vec3.add( Vec3.add(Vec3.mulScalar(xAxis, v.x), Vec3.mulScalar(yAxis, v.y)), Vec3.mulScalar(Vec3.clone(normal), v.z) )
    }

    microfacetNormal(baseDirection, normal){
        const dir_local = this.toLocal(baseDirection, normal)

        Vec3.mul(dir_local, Vec3.new(this.roughnessX , this.roughnessY, 1))
        Vec3.normalize(dir_local)

        let p = Vec3.new()
        Vec3.random(p)
        while(p.x*p.x + p.y*p.y >= 1){
            Vec3.random(p)
        }
        const h = Math.sqrt(1-p.x*p.x)
        const x = (1+dir_local.z)/2
        p.y = p.y*x + h*(1-x)

        const T1 = Vec3.normalize(Vec3.cross(Vec3.clone(Vec3.Z), dir_local))
        const T2 = Vec3.normalize(Vec3.cross(Vec3.clone(dir_local), T1))

        let normalLocal = Vec3.add(
            Vec3.add(Vec3.mulScalar(Vec3.clone(T1), p.x), Vec3.mulScalar(Vec3.clone(T2), p.y)),
            Vec3.mulScalar(Vec3.clone(dir_local), Math.sqrt(1-(p.x*p.x+p.y*p.y)) )
        )

        Vec3.mul(normalLocal, Vec3.new(this.roughnessX , this.roughnessY, 1))
        Vec3.normalize(normalLocal)
        return Vec3.normalize(this.toGlobal(normalLocal, normal))
    } 

    TrowbridgeReitz(dir, normal){
        const cosI   = Vec3.normalize(this.toLocal(dir, normal)).z
        const cosPhi = this.cosPhi(dir, normal)
        const tanISqr = 1/(cosI*cosI) - 1
        const cosPhiSqr = cosPhi*cosPhi
        const sinPhiSqr =  1 - cosPhiSqr

        const cosI4 = Math.pow(cosI, 4)
        const parenthesis = 1+tanISqr*(cosPhiSqr/(this.roughnessX*this.roughnessX) + sinPhiSqr/(this.roughnessY*this.roughnessY))
        return 1/(Math.PI*this.roughnessX*this.roughnessY*cosI4*parenthesis*parenthesis)
    }

    MaskingLambda(dir, normal){
        const cosI   = Vec3.normalize(this.toLocal(dir, normal)).z
        const cosPhi = this.cosPhi(dir, normal)
        const tanISqr = 1/(cosI*cosI) - 1
        const cosPhiSqr = cosPhi*cosPhi
        const sinPhiSqr =  1 - cosPhiSqr
        const alphaSqr = this.roughnessX*this.roughnessX*cosPhiSqr + this.roughnessY*this.roughnessY*sinPhiSqr
        return (Math.sqrt(1+alphaSqr*tanISqr)-1)/2
    }

    Masking(dir, normal){
        return 1/(1+this.MaskingLambda(dir, normal))
    }

    MaskingShadowing(dirIn, dirOut, normal){
        return 1/(1+this.MaskingLambda(dirIn, normal)+this.MaskingLambda(dirOut, normal))
    }

    xAxis(normal){
        if(normal.x == 0 && normal.y == 0){
            return Vec3.clone(Vec3.X)
        }else{
            return Vec3.normalize(Vec3.new(-normal.y, normal.x, 0))
        }
    }
}



// Uses the Torrance-Sparrow BSDF based on the Trowbridge-Reitz microfacet model
export class RoughConductor{
    constructor(color, etaFrom=1, etaTo=1, roughness=0){
        this.type      = BxDF.RoughConductor
        this.color     = color
        this.etaFrom   = etaFrom
        this.etaTo     = etaTo  
        this.roughness = roughness

        this.alphaX = 0.05
        this.alphaY = 0.05
    }

    sample(ray, normal){
        let etaRatio
        let cosI = Vec3.dot(ray.getDirection(), normal);
        ({etaRatio, cosI} = Utils.adjustIfExitingRay(cosI, this.etaFrom, this.etaTo, normal))

        const microfacetNormal = this.microfacetNormal(ray.direction, normal, cosI)
        const direction_out = Utils.reflect(ray.direction, microfacetNormal)

        const cosI_out = Vec3.dot(direction_out, microfacetNormal)

        let xAxis = Vec3.normalize(Vec3.new(-normal.y, normal.x, 0))
        if(normal.x == 0 && normal.y == 0){
            xAxis = Vec3.X
        }
        const reverseDir = Vec3.mulScalar(Vec3.clone(ray.direction), -1)
        const dir_local = this.toLocal(reverseDir, normal)
        const dir_local_plane = Vec3.normalize(Vec3.new(dir_local.x, dir_local.y, 0))
        const cosPhi_in = Vec3.dot(xAxis, dir_local_plane)


        const dir_local_out = this.toLocal(direction_out, normal)
        const dir_local_out_plane = Vec3.normalize(Vec3.new(dir_local_out.x, dir_local_out.y, 0))
        const cosPhi_out = Vec3.dot(xAxis, dir_local_out_plane)

        const G = this.MaskingShadowing(cosI, cosPhi_in, cosI_out, cosPhi_out)
        const factor = this.TrowbridgeReitz(cosI, cosPhi_in)*G/(4*cosI*cosI_out)

        return {
            weight     : Color.mulScalar(Color.clone(this.color), G/G),
            throughput : Color.mulScalar(Color.clone(this.color), factor/factor), 
            direction  : direction_out
        }
    }

    toLocal(v, normal){
        let xAxis = Vec3.normalize(Vec3.new(-normal.y, normal.x, 0))
        if(normal.x == 0 && normal.y == 0){
            xAxis = Vec3.X
        }
        const yAxis = Vec3.normalize(Vec3.cross(Vec3.clone(xAxis), normal))
        return Vec3.normalize(Vec3.new(Vec3.dot(v, xAxis), Vec3.dot(v, yAxis), Vec3.dot(v, normal))) 
    }

    toGlobal(v, normal){
        let xAxis = Vec3.normalize(Vec3.new(-normal.y, normal.x, 0))
        if(normal.x == 0 && normal.y == 0){
            xAxis = Vec3.X
        }
        const yAxis = Vec3.normalize(Vec3.cross(Vec3.clone(xAxis), normal))
        return Vec3.add( Vec3.add(Vec3.mulScalar(xAxis, v.x), Vec3.mulScalar(yAxis, v.y)), Vec3.mulScalar(Vec3.clone(normal), v.z) )
    }

    microfacetNormal(baseDirection, normal, cosI){
        const reverseDir = Vec3.mulScalar(Vec3.clone(baseDirection), -1)
        const dir_local = this.toLocal(reverseDir, normal)

        Vec3.mul(dir_local, Vec3.new(this.alphaX , this.alphaY, 1))

        let p = Vec3.new()
        Vec3.random(p)
        while(p.x*p.x + p.y*p.y >= 1){
            Vec3.random(p)
        }
        p.y = p.y*(1+cosI)/2 + Math.sqrt(1-p.x*p.x)*(1-cosI)/2

        const T1 = Vec3.normalize(Vec3.cross(Vec3.clone(Vec3.Z), dir_local))
        const T2 = Vec3.normalize(Vec3.cross(Vec3.clone(T1), dir_local))

        let sum = Vec3.add(
            Vec3.add(Vec3.mulScalar(T1, p.x), Vec3.mulScalar(T2, p.y)),
            Vec3.mulScalar(Vec3.clone(dir_local), Math.sqrt(1-(p.x*p.x+p.y*p.y)) )
        )
        Vec3.mul(sum, Vec3.new(this.alphaX , this.alphaY, 1))

        return Vec3.normalize(this.toGlobal(sum, normal))
    } 

    TrowbridgeReitz(cosI, cosPhi){
        const tanISqr = 1/(cosI*cosI) - 1
        const cosPhiSqr = cosPhi*cosPhi
        const sinPhiSqr =  1 - cosPhiSqr

        const cosI4 = Math.pow(cosI, 4)
        const parenthesis = 1+tanISqr*(cosPhiSqr/(this.alphaX*this.alphaX) + sinPhiSqr/(this.alphaY*this.alphaY))
        return 1/(Math.PI*this.alphaX*this.alphaY*cosI4*parenthesis*parenthesis)
    }

    MaskingLambda(cosI, cosPhi){
        const tanISqr = 1/(cosI*cosI) - 1
        const cosPhiSqr = cosPhi*cosPhi
        const sinPhiSqr =  1 - cosPhiSqr
        const alpha = Math.sqrt(this.alphaX*this.alphaX*cosPhiSqr + this.alphaY*this.alphaY*sinPhiSqr)
        return (Math.sqrt(1+alpha*alpha*tanISqr)-1)/2
    }

    MaskingShadowing(cosI_in, cosPhi_in, cosI_out, cosPhi_out){
        return 1/(1+this.MaskingLambda(cosI_in, cosPhi_in)+this.MaskingLambda(cosI_out, cosPhi_out))
    }
}