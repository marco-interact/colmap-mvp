/**
 * Area Measurement Class
 * Based on https://github.com/AwesomeTeamOne/3DView.Measurements
 * Adapted for React Three Fiber and modern Three.js
 */

import * as THREE from 'three'
import { Measurement } from './Measurement.js'

export class MeasurementArea extends Measurement {
  constructor() {
    super()
    this.type = 'area'
    this.minPoints = 3
    this.maxPoints = 10
  }

  isComplete() {
    return this.points.length >= this.minPoints
  }

  canAddMorePoints() {
    return this.points.length < this.maxPoints
  }

  getValue() {
    if (this.points.length < 3) return 0
    
    // Calculate area using the shoelace formula for 3D polygon
    let area = 0
    const n = this.points.length
    
    // Project points onto the best-fit plane and calculate 2D area
    const normal = this.calculatePolygonNormal()
    const projected = this.projectPointsToPlane(normal)
    
    // Use shoelace formula on projected 2D points
    for (let i = 0; i < projected.length; i++) {
      const j = (i + 1) % projected.length
      area += projected[i].x * projected[j].y
      area -= projected[j].x * projected[i].y
    }
    
    return Math.abs(area) / 2
  }

  calculatePolygonNormal() {
    if (this.points.length < 3) return new THREE.Vector3(0, 1, 0)
    
    // Use Newell's method to calculate polygon normal
    const normal = new THREE.Vector3()
    
    for (let i = 0; i < this.points.length; i++) {
      const current = this.points[i]
      const next = this.points[(i + 1) % this.points.length]
      
      normal.x += (current.y - next.y) * (current.z + next.z)
      normal.y += (current.z - next.z) * (current.x + next.x)
      normal.z += (current.x - next.x) * (current.y + next.y)
    }
    
    return normal.normalize()
  }

  projectPointsToPlane(normal) {
    // Create a coordinate system on the plane
    const up = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const right = new THREE.Vector3().crossVectors(up, normal).normalize()
    const forward = new THREE.Vector3().crossVectors(normal, right).normalize()
    
    // Project each point onto the plane
    return this.points.map(point => {
      return new THREE.Vector2(
        point.dot(right),
        point.dot(forward)
      )
    })
  }

  getFormattedValue() {
    const value = this.getValue()
    if (value > 1) {
      return `${value.toFixed(3)} m²`
    } else if (value > 0.0001) {
      return `${(value * 10000).toFixed(1)} cm²`
    } else {
      return `${(value * 1000000).toFixed(1)} mm²`
    }
  }

  updateSpecificVisualization() {
    if (this.points.length < 2) return

    // Create lines connecting all points
    const allPoints = [...this.points]
    if (this.previewPoint && !this.isFinished) {
      allPoints.push(this.previewPoint)
    }

    // Connect consecutive points
    for (let i = 0; i < allPoints.length; i++) {
      const nextIndex = (i + 1) % allPoints.length
      if (nextIndex === 0 && allPoints.length <= 2) continue // Don't close if less than 3 points
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        allPoints[i],
        allPoints[nextIndex]
      ])
      
      const line = new THREE.Line(lineGeometry, this.lineMaterial)
      this.object3D.add(line)
    }

    // If we have enough points for an area, draw the filled polygon
    if (this.points.length >= 3) {
      this.addAreaVisualization()
    }
  }

  addAreaVisualization() {
    // Create a semi-transparent face to show the measured area
    const shape = new THREE.Shape()
    const normal = this.calculatePolygonNormal()
    const projected = this.projectPointsToPlane(normal)
    
    if (projected.length >= 3) {
      shape.moveTo(projected[0].x, projected[0].y)
      for (let i = 1; i < projected.length; i++) {
        shape.lineTo(projected[i].x, projected[i].y)
      }
      shape.lineTo(projected[0].x, projected[0].y) // Close the shape
      
      const geometry = new THREE.ShapeGeometry(shape)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      
      // Position the mesh in 3D space
      const center = this.getPolygonCenter()
      mesh.position.copy(center)
      mesh.lookAt(center.clone().add(normal))
      
      this.object3D.add(mesh)

      // Add area label at center
      const label = this.createTextSprite(this.getFormattedValue(), center)
      this.object3D.add(label)
    }
  }

  getPolygonCenter() {
    const center = new THREE.Vector3()
    this.points.forEach(point => center.add(point))
    return center.divideScalar(this.points.length)
  }

  getInfo() {
    return {
      ...super.getInfo(),
      area: this.getValue(),
      formattedArea: this.getFormattedValue(),
      points: this.points,
      normal: this.calculatePolygonNormal()
    }
  }
}
