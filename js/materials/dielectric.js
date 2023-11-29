import { Vec3, Color } from "../primitives.js"
import { Material } from "./material.js"
import { MaterialTypes, Utils } from "./utils.js"

export default class Dielectric extends Material{
    constructor(color, etaFrom=1, etaTo=1){
        super()
        this.type    = MaterialTypes.Dielectric
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    static deserialize(mat){
        return new Dielectric(mat.color, mat.etaFrom, mat.etaTo)
    }

    hitLocal(dirIn){
        const cosI     = Math.abs(dirIn.z)
        const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
        const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
        const etaRatio = etaFrom/etaTo

        const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
        
        let dirOut
        if(cosT === false){ // Total internal reflection
            dirOut = Utils.reflect(dirIn)
        }else{
            const reflectance = this.fresnelReflectance(etaRatio, cosI, cosT)
            if(reflectance > Math.random()){
                dirOut = Utils.reflect(dirIn)
            }else{ // Transmit
                dirOut = Vec3.set(dirIn, dirIn.x*etaRatio, dirIn.y*etaRatio, cosT*Math.sign(dirIn.z))
            }
        }

        return {
            color: Color.mulScalar(Color.clone(this.color), 1/Math.abs(dirOut.z)),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut){
        // The PDF is a Dirac distribution.
        // Intuitively, the chance that a given dirIn reflects to a given dirOut is zero, 
        // as all the radiance is reflected toward a single unique direction
        return Color.ZERO
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}