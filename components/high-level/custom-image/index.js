import { Image } from "expo-image";
import React from "react";
import ActivityLoading from "@/components/high-level/activity-loading";

const CustomImage = ({ children, uri, style, isLocalFile, loading, resizeMode, contentFit }) => {
  if (loading) return <ActivityLoading style={{ flex: 0.655 }} />;
  return (
    <Image source={isLocalFile ? uri : { uri }} style={style} contentFit={contentFit || resizeMode}>
      {children}
    </Image>
  );
};

export default React.memo(CustomImage);
