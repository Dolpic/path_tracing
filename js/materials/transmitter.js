import { Material, MaterialTypes, Utils } from "./material.js"
import { Vec3, Color } from "../primitives.js"

export default class Transmitter extends Material{
    constructor(color, etaFrom=1, etaTo=1){
        super()
        this.type    = MaterialTypes.Transmitter
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    static deserialize(mat){
        return new Transmitter(mat.color, mat.etaFrom, mat.etaTo)
    }

    hitLocal(dirIn){
        const cosI     = Math.abs(dirIn.z)
        const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
        const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
        const etaRatio = etaFrom/etaTo

        const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)

        let dirOut
        // If total internal refraction OR reflection due to Schlick approximation
        if(cosT == false || this.schlickApproximation(cosI, etaFrom, etaTo) > Math.random()){ 
            dirOut = Utils.reflect(dirIn)
        }else{
            dirOut = Vec3.set(dirIn, dirIn.x*etaRatio, dirIn.y*etaRatio, cosT*Math.sign(dirIn.z))
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

    schlickApproximation(cos, etaFrom, etaTo) {
        const r = (etaFrom-etaTo)/(etaFrom+etaTo)
        const rSqr = r*r
        return rSqr + (1-rSqr)*Math.pow(1-cos, 5)
    }
}