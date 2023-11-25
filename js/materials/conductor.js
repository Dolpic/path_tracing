import { Vec3, Complex, Color } from "../primitives.js"
import { Material, MaterialTypes, Utils } from "./material.js"

export default class Conductor extends Material{
    constructor(color, etaFrom, etaTo, roughnessX=0, roughnessY=0){
        super()
        this.type    = MaterialTypes.Conductor
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
        this.roughnessX = 1//roughnessX
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
            dirOut = Utils.reflectWithNormal(dirIn, this.microfacetNormal(dirIn))

            // If dirOut goes further into the material, we discard it
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
        const cosI = Math.abs(dirIn.z)
        let etaRatio
        if(dirIn.z > 0){
            etaRatio = Complex.div(Complex.clone(this.etaTo), this.etaFrom)
        }else{
            etaRatio = Complex.div(Complex.clone(this.etaFrom), this.etaTo)
        }

        if(this.roughnessX == 0 && this.roughnessY == 0){
            if(!sampleFromHit) return Color.clone(Color.ZERO)
            const cosT = this.cosThetaSnellLawComplex(etaRatio, cosI)
            const reflectance = this.fresnelReflectanceComplex(etaRatio, Complex.fromReal(cosI), cosT)
            return Color.mulScalar(Color.clone(this.color), reflectance/Math.abs(dirOut.z))
        }else{
            const reversedIn = Vec3.mulScalar(Vec3.clone(dirIn), -1)
            const microNormal = Vec3.normalize(Vec3.add(dirIn, dirOut))
            const cosI_m = Math.abs(Vec3.dot(reversedIn, microNormal))
            const D = this.TrowbridgeReitz(microNormal)
            const f = D*this.MaskingShadowing(reversedIn, dirOut)/(4*cosI*Math.abs(dirOut.z))
            const PDF = (D*(this.Masking(reversedIn)/cosI)*cosI_m) / (4*cosI_m)
            const cosT = this.cosThetaSnellLawComplex(etaRatio, cosI_m)
            const reflectance = this.fresnelReflectanceComplex(etaRatio, Complex.fromReal(cosI_m), cosT)
            const finalFactor = sampleFromHit ? reflectance*f/PDF : reflectance*f
            return Color.mulScalar(Color.clone(this.color), finalFactor)
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

    microfacetNormal(dir){
        const roughness = Vec3.new(this.roughnessX , this.roughnessY, 1)
        const dirReversed = Vec3.mulScalar(Vec3.clone(dir), -1)

        Vec3.normalize(Vec3.mul(dirReversed, roughness))
        const axisX = Vec3.normalize(Vec3.cross(Vec3.clone(Vec3.Z), dirReversed))
        const axisY = Vec3.normalize(Vec3.cross(Vec3.clone(dirReversed), axisX))

        let p = Vec3.random(Vec3.new())
        while(p.x*p.x + p.y*p.y >= 1){
            Vec3.random(p)
        }
        const h = Math.sqrt(1-p.x*p.x)
        const x = (1+dirReversed.z)/2
        p.y = p.y*x + h*(1-x)

        const pz = Math.sqrt(1-p.x*p.x-p.y*p.y)
        const normal = Vec3.add(
            Vec3.add(Vec3.mulScalar(axisX, p.x), Vec3.mulScalar(axisY, p.y)),
            Vec3.mulScalar(dirReversed, pz)
        )

        return Vec3.normalize(Vec3.mul(normal, roughness))
    } 

    TrowbridgeReitz(dir){
        const cosThetaSqr = dir.z*dir.z
        const cosPhi = dir.x / Math.sqrt(1-cosThetaSqr)
        const tanISqr = 1/(cosThetaSqr) - 1
        const cosPhiSqr = cosPhi*cosPhi
        const sinPhiSqr =  1 - cosPhiSqr

        const cosI4 = cosThetaSqr*cosThetaSqr
        const parenthesis = 1+tanISqr*(cosPhiSqr/(this.roughnessX*this.roughnessX) + sinPhiSqr/(this.roughnessY*this.roughnessY))
        return 1/(Math.PI*this.roughnessX*this.roughnessY*cosI4*parenthesis*parenthesis)
    }

    MaskingLambda(dir){
        const cosThetaSqr = dir.z*dir.z
        const cosPhi = dir.x / Math.sqrt(1-cosThetaSqr)
        const tanISqr = 1/cosThetaSqr - 1
        const cosPhiSqr = cosPhi*cosPhi
        const sinPhiSqr =  1 - cosPhiSqr
        const alphaSqr = this.roughnessX*this.roughnessX*cosPhiSqr + this.roughnessY*this.roughnessY*sinPhiSqr
        return (Math.sqrt(1+alphaSqr*tanISqr)-1)/2
    }

    Masking(dir){
        return 1/(1+this.MaskingLambda(dir))
    }

    MaskingShadowing(dirIn, dirOut){
        return 1/(1+this.MaskingLambda(dirIn)+this.MaskingLambda(dirOut))
    }
}
