import { Vec3, Complex, Color } from "../primitives.js"
import { Material } from "./material.js"
import { MaterialTypes, Utils } from "./utils.js"

export default class Conductor extends Material{
    constructor(color, etaFrom, etaTo, roughnessX=0, roughnessY=0){
        super()
        this.type    = MaterialTypes.Conductor
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
        this.roughnessX = 0.1//roughnessX
        this.roughnessY = 0.1//roughnessY
    }

    static deserialize(mat){
        return new Conductor(mat.color, mat.etaFrom, mat.etaTo, mat.roughnessX, mat.roughnessY)
    }

    hitLocal(dirIn){
        let dirOut
        if(this.roughnessX == 0 && this.roughnessY == 0){
            dirOut = Utils.reflect(Vec3.clone(dirIn))
        }else{
            const microNormal = Utils.TrowbridgeReitzMicrofacet(dirIn, this.roughnessX, this.roughnessY)
            dirOut = Utils.reflectWithNormal(dirIn, microNormal)
            if(Utils.areSameHemisphere(dirIn, dirOut)){
                return false
            }
        }
        return {
            color: this.sampleLocal(dirIn, dirOut, true),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut, sampleFromHit=false){
        if(Utils.areSameHemisphere(dirIn, dirOut)){
            return Color.clone(Color.ZERO)
        }

        let etaRatio
        if(dirIn.z > 0){
            etaRatio = Complex.div(Complex.clone(this.etaTo), this.etaFrom)
        }else{
            etaRatio = Complex.div(Complex.clone(this.etaFrom), this.etaTo)
        }

        if(this.roughnessX == 0 && this.roughnessY == 0){
            if(!sampleFromHit) return Color.clone(Color.ZERO)
            const cosI = Math.abs(dirIn.z)
            const cosT = this.cosThetaSnellLawComplex(etaRatio, cosI)
            const reflectance = this.fresnelReflectanceComplex(etaRatio, Complex.fromReal(cosI), cosT)
            return Color.mulScalar(Color.clone(this.color), reflectance/Math.abs(dirOut.z))
        }else{
            const cosI = Math.abs(dirIn.z)
            const reversedIn = Vec3.mulScalar(Vec3.clone(dirIn), -1)
            const microNormal = Vec3.normalize(Vec3.add(Vec3.clone(reversedIn), dirOut))
            const cosI_m = Math.abs(Vec3.dot(reversedIn, microNormal))
            const D = Utils.TrowbridgeReitz(microNormal, this.roughnessX, this.roughnessY)
            const f = D*Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)/(4*cosI*Math.abs(dirOut.z))
            const PDF = (D*(Utils.Masking(reversedIn, this.roughnessX, this.roughnessY)/cosI)*cosI_m) / (4*cosI_m)
            const cosT = this.cosThetaSnellLawComplex(etaRatio, cosI_m)
            const reflectance = this.fresnelReflectanceComplex(etaRatio, Complex.fromReal(cosI_m), cosT)
            return Color.mulScalar(Color.clone(this.color), reflectance*(sampleFromHit?f/PDF:f))
        }
    }

    cosThetaSnellLawComplex(etaRatio, cosI){
        const squared = Complex.sub(
            Complex.fromReal(1), 
            Complex.mul( 
                Complex.mul( Complex.clone(etaRatio), etaRatio), 
                Complex.fromReal(1-cosI*cosI)
            )
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
