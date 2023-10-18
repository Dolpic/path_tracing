export class Ray {
    constructor(){console.error("Ray has no constructor !")}

    static new(origin, direction){
        return {origin:origin, direction:direction}
    }

    static moveAt(ray, t){
        ray.origin.x += ray.direction.x * t
        ray.origin.y += ray.direction.y * t
        ray.origin.z += ray.direction.z * t
    }
}

export class Vec3 {
    constructor(){console.error("Vec3 has no constructor !")}

    static new(x, y, z){
        return {x:x, y:y, z:z}
    }

    static clone(self){
        return {x:self.x, y:self.y, z:self.z}
    }

    static equal(self, other){
        self.x = other.x
        self.y = other.y
        self.z = other.z
    }

    static mul(self, scalar){
        self.x *= scalar
        self.y *= scalar
        self.z *= scalar
        return self
    }

    static sub(self, other){
        self.x -= other.x
        self.y -= other.y
        self.z -= other.z
        return self
    }

    static add(self, other){
        self.x += other.x
        self.y += other.y
        self.z += other.z
        return self
    }

    static cross(self, other){
        let tmp_x = self.x
        let tmp_y = self.y
        let tmp_z = self.z
        self.x = tmp_y*other.z - tmp_z*other.y
        self.y = tmp_z*other.x - tmp_x*other.z
        self.z = tmp_x*other.y - tmp_y*other.x
        return self
    }

    static dot(self, other){
        return self.x * other.x + self.y * other.y + self.z * other.z
    }

    static norm(self){
        return Math.sqrt(Vec3.norm_squared(self))
    }

    static norm_squared(self){
        return self.x*self.x + self.y*self.y + self.z*self.z
    }

    static normalize(self){
        let norm = Vec3.norm(self)
        self.x /= norm
        self.y /= norm
        self.z /= norm
        return self
    }

    static random(self){
        self.x = Math.random()*2-1
        self.y = Math.random()*2-1
        self.z = Math.random()*2-1
    }

    // Can be improved but ok for now
    static random_spheric(self){
        Vec3.random(self)
        while(Vec3.norm(self) > 1){
            Vec3.random(self)
        }
        return self
    }
}

export class Color{
    constructor(){console.error("Color has no constructor !")}

    static new(r, g, b, a=1){
        return {r:r, g:g, b:b, a:a}
    }

    static equal(self, other){
        self.r = other.r
        self.g = other.g
        self.b = other.b
        self.a = other.a
    }

    static add(self, other){
        self.r += other.r
        self.g += other.g
        self.b += other.b
        self.a += other.a
        return self
    }

    static mul(self, other){
        self.r *= other.r
        self.g *= other.g
        self.b *= other.b
        self.a *= other.a
        return self
    }

    static div(self, scalar){
        self.r /= scalar
        self.g /= scalar
        self.b /= scalar
        self.a /= scalar
        return self
    }

    static gamma_correct(self){
        self.r = Math.sqrt(self.r)
        self.g = Math.sqrt(self.g)
        self.b = Math.sqrt(self.b)
        return self
    }
}