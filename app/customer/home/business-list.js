import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import LayoutView from '@/components/high-level/layout-view'

const BusinessList = () => {
  return (
    <LayoutView showBackButton={true} title="İşletmeler">
      <Text>business-list</Text>
    </LayoutView>
  )
}

export default BusinessList

const styles = StyleSheet.create({})