import { Vec3, Color } from "../primitives.js"
import { Material } from "./material.js"
import { MaterialTypes, Utils } from "./utils.js"

export default class Diffuse extends Material{
    constructor(color, cosWeightedSampling=true){
        super()
        this.type  = MaterialTypes.Diffuse
        this.color = color
        this.cosWeightedSampling = cosWeightedSampling
    }

    static deserialize(mat){
        return new Diffuse(mat.color, mat.cosWeightedSampling)
    }

    hitLocal(dirIn){
        let dirOut, PDF
        if(this.cosWeightedSampling){
            dirOut = Vec3.randomOnHemisphereCosWeighted(Vec3.new())
            PDF = Math.abs(dirOut.z) * (1/Math.PI)
        }else{
            dirOut = Vec3.randomOnHemisphere(Vec3.new())
            PDF =  0.5 * (1/Math.PI)
        }

        if(Utils.areSameHemisphere(dirOut, dirIn)){
            dirOut.z *= -1
        }

        return {
            color : Color.mulScalar(this.sampleLocal(dirIn, dirOut), 1/PDF),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut){
        if(Utils.areSameHemisphere(dirIn, dirOut)){
            return Color.ZERO
        }
        return Color.mulScalar(Color.clone(this.color), 1/Math.PI)
    }
}