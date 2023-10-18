export class Ray {
    constructor(origin, direction){
        this.origin = origin
        this.direction = direction
    }

    at(t){
        return this.origin.add(this.direction.mul(t))
    }
}

export class Vec3 {
    constructor(x,y,z){
        this.x = x
        this.y = y
        this.z = z
    }

    mul(scalar){
        return new Vec3( this.x * scalar, this.y * scalar, this.z * scalar)
    }

    sub(vec){
        return new Vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z)
    }

    add(vec){
        return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z)
    }

    dot(vec){
        return this.x * vec.x + this.y * vec.y + this.z * vec.z
    }

    norm(){
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }

    norm_squared(){
        return this.x*this.x + this.y*this.y + this.z*this.z
    }

    normalized(){
        let norm = this.norm()
        return new Vec3(this.x/norm, this.y/norm, this.z/norm)
    }

    static random(){
        return new Vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1)
    }

    static random_spheric(){
        while(true){
            let vec = this.random()
            if(vec.norm() <= 1){
                return vec
            }
        }
    }
}