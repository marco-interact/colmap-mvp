/**
 * Distance Measurement Class
 * Based on https://github.com/AwesomeTeamOne/3DView.Measurements
 * Adapted for React Three Fiber and modern Three.js
 */

import * as THREE from 'three'
import { Measurement } from './Measurement.js'

export class MeasurementDistance extends Measurement {
  constructor() {
    super()
    this.type = 'distance'
    this.requiredPoints = 2
  }

  isComplete() {
    return this.points.length >= this.requiredPoints
  }

  getValue() {
    if (this.points.length < 2) return 0
    return this.points[0].distanceTo(this.points[1])
  }

  getFormattedValue() {
    const value = this.getValue()
    if (value > 1) {
      return `${value.toFixed(3)} m`
    } else if (value > 0.01) {
      return `${(value * 100).toFixed(1)} cm`
    } else {
      return `${(value * 1000).toFixed(1)} mm`
    }
  }

  updateSpecificVisualization() {
    if (this.points.length < 1) return

    // Determine end point (either second point or preview point)
    const endPoint = this.points.length >= 2 ? this.points[1] : this.previewPoint
    if (!endPoint) return

    // Create line geometry
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      this.points[0],
      endPoint
    ])

    // Create line
    const line = new THREE.Line(lineGeometry, this.lineMaterial)
    this.object3D.add(line)

    // Add measurement label at midpoint
    const midpoint = new THREE.Vector3().lerpVectors(this.points[0], endPoint, 0.5)
    const distance = this.points[0].distanceTo(endPoint)
    
    if (distance > 0) {
      const label = this.createTextSprite(this.getFormattedValue(), midpoint)
      this.object3D.add(label)
    }

    // Mark as finished if we have both points
    if (this.points.length >= 2) {
      this.isFinished = true
    }
  }

  getInfo() {
    return {
      ...super.getInfo(),
      distance: this.getValue(),
      formattedDistance: this.getFormattedValue(),
      startPoint: this.points[0],
      endPoint: this.points[1]
    }
  }
}
